// static/js/pharmacy_admin.js

let allDrugs = [];
let currentFilter = "all"; // "all" | "review" | "low"

// ---------- loading ----------

async function loadDrugs() {
  let url = "/drug/";
  if (currentFilter === "review") url = "/drug/needs-review";
  if (currentFilter === "low") url = "/drug/low-stock";

  const response = await authFetch(url);
  if (!response) return;
  if (response.status === 403) {
    document.getElementById(
      "drugTableBody"
    ).innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">You don't have access to the drug inventory.</td></tr>`;
    return;
  }
  if (!response.ok) {
    document.getElementById(
      "drugTableBody"
    ).innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">Could not load drugs.</td></tr>`;
    return;
  }

  allDrugs = await response.json();
  if (!Array.isArray(allDrugs)) allDrugs = [];
  renderSummary();
  applyFilters();
}

// Counts for the summary strip. Computed from the full catalogue, so they
// stay correct regardless of which filter is showing.
async function renderSummary() {
  const resAll = await authFetch("/drug/");
  if (!resAll || !resAll.ok) return;
  const drugs = await resAll.json();
  if (!Array.isArray(drugs)) return;

  const lowStock = drugs.filter(
    (d) => d.reorder_level != null && d.quantity <= d.reorder_level
  ).length;
  const review = drugs.filter((d) => d.needs_review).length;
  const outOfStock = drugs.filter((d) => d.quantity === 0).length;

  document.getElementById("reviewCount").textContent = review;

  document.getElementById("summaryCards").innerHTML = `
    <div class="col-md-3">
      <div class="card shadow-sm border-0 border-start border-4 border-primary">
        <div class="card-body"><small class="text-muted">Drugs in catalogue</small>
        <h4 class="fw-bold mb-0">${drugs.length}</h4></div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card shadow-sm border-0 border-start border-4 border-danger">
        <div class="card-body"><small class="text-muted">Out of stock</small>
        <h4 class="fw-bold mb-0">${outOfStock}</h4></div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card shadow-sm border-0 border-start border-4 border-warning">
        <div class="card-body"><small class="text-muted">Running low</small>
        <h4 class="fw-bold mb-0">${lowStock}</h4></div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card shadow-sm border-0 border-start border-4 border-secondary">
        <div class="card-body"><small class="text-muted">Needs review</small>
        <h4 class="fw-bold mb-0">${review}</h4></div>
      </div>
    </div>`;
}

// ---------- filtering + rendering ----------

function applyFilters() {
  const term = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const category = document.getElementById("categoryFilter").value;

  let rows = allDrugs;
  if (category) rows = rows.filter((d) => d.category === category);
  if (term) {
    rows = rows.filter(
      (d) =>
        (d.name || "").toLowerCase().includes(term) ||
        (d.generic || "").toLowerCase().includes(term)
    );
  }
  renderTable(rows);
}

function renderTable(drugs) {
  const body = document.getElementById("drugTableBody");

  if (!drugs.length) {
    body.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">No drugs match.</td></tr>`;
    return;
  }

  body.innerHTML = drugs
    .map((d) => {
      const low = d.reorder_level != null && d.quantity <= d.reorder_level;
      const out = d.quantity === 0;

      // The red line he asked for: out of stock is red, running low is amber.
      let qtyBadge = `<span class="badge bg-success">${d.quantity}</span>`;
      if (low)
        qtyBadge = `<span class="badge bg-warning text-dark">${d.quantity}</span>`;
      if (out) qtyBadge = `<span class="badge bg-danger">${d.quantity}</span>`;

      return `
      <tr class="${out ? "table-danger" : low ? "table-warning" : ""}">
        <td>
          <strong>${d.name}</strong>
          ${
            d.needs_review
              ? `<span class="badge bg-warning text-dark ms-2">check spelling</span>`
              : ""
          }
          ${
            d.generic
              ? `<br><small class="text-muted">${d.generic}</small>`
              : ""
          }
        </td>
        <td><small class="text-muted">${d.category}</small></td>
        <td class="text-end">${qtyBadge}</td>
        <td class="text-end"><small class="text-muted">${
          d.reorder_level ?? "—"
        }</small></td>
        <td class="text-end"><small>${
          d.unit_cost != null ? "₦" + d.unit_cost : "—"
        }</small></td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-success" onclick="openStockIn(${
            d.id
          })">Stock in</button>
          <button class="btn btn-sm btn-outline-warning" onclick="openAdjust(${
            d.id
          })">Adjust</button>
          <button class="btn btn-sm btn-outline-primary" onclick="openEdit(${
            d.id
          })">Edit</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="openHistory(${
            d.id
          })">History</button>
        </td>
      </tr>`;
    })
    .join("");
}

function findDrug(id) {
  return allDrugs.find((d) => d.id === id);
}

// ---------- add / edit ----------

function openEdit(id) {
  const d = findDrug(id);
  if (!d) return;
  document.getElementById("drugModalTitle").textContent = "Edit Drug";
  document.getElementById("drugId").value = d.id;
  document.getElementById("d_name").value = d.name || "";
  document.getElementById("d_generic").value = d.generic || "";
  document.getElementById("d_category").value = d.category || "Tablet/Capsule";
  document.getElementById("d_unit_cost").value = d.unit_cost ?? "";
  document.getElementById("d_reorder_level").value = d.reorder_level ?? "";
  new bootstrap.Modal(document.getElementById("drugModal")).show();
}

document.getElementById("showAddDrugBtn").onclick = function () {
  document.getElementById("drugModalTitle").textContent = "Add Drug";
  document.getElementById("drugId").value = "";
  ["d_name", "d_generic", "d_unit_cost", "d_reorder_level"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
  document.getElementById("d_category").value = "Tablet/Capsule";
  new bootstrap.Modal(document.getElementById("drugModal")).show();
};

document.getElementById("saveDrugBtn").onclick = async function () {
  const id = document.getElementById("drugId").value;
  const name = document.getElementById("d_name").value.trim();
  if (!name) {
    alert("Enter the drug name.");
    return;
  }

  const num = (elId) => {
    const v = document.getElementById(elId).value;
    return v === "" ? null : Number(v);
  };

  const body = {
    name: name,
    generic: document.getElementById("d_generic").value.trim() || null,
    category: document.getElementById("d_category").value,
    unit_cost: num("d_unit_cost"),
    reorder_level: num("d_reorder_level"),
  };

  // New drug -> POST. Existing -> PATCH, because it's a partial update.
  const url = id ? `/drug/${id}` : "/drug/";
  const method = id ? "PATCH" : "POST";

  const response = await authFetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("Only a super admin can change the drug catalogue.");
    return;
  }
  if (response.ok) {
    bootstrap.Modal.getInstance(document.getElementById("drugModal")).hide();
    loadDrugs();
  } else {
    alert("Could not save the drug.");
  }
};

// ---------- stock in ----------

function openStockIn(id) {
  const d = findDrug(id);
  if (!d) return;
  document.getElementById("stockInDrugId").value = d.id;
  document.getElementById("stockInDrugName").textContent = d.name;
  document.getElementById("stockInCurrent").textContent = d.quantity;
  document.getElementById("s_amount").value = "";
  document.getElementById("s_reason").value = "";
  new bootstrap.Modal(document.getElementById("stockInModal")).show();
}

document.getElementById("saveStockInBtn").onclick = async function () {
  const id = document.getElementById("stockInDrugId").value;
  const amount = parseInt(document.getElementById("s_amount").value, 10);
  if (!amount || amount <= 0) {
    alert("Enter how many units arrived.");
    return;
  }

  const response = await authFetch(`/drug/${id}/stock-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amount,
      reason: document.getElementById("s_reason").value.trim() || null,
    }),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("Only a super admin can add stock.");
    return;
  }
  if (response.ok) {
    bootstrap.Modal.getInstance(document.getElementById("stockInModal")).hide();
    loadDrugs();
  } else {
    const data = await response.json().catch(() => ({}));
    alert(data.detail || "Could not add stock.");
  }
};

// ---------- adjust ----------

function openAdjust(id) {
  const d = findDrug(id);
  if (!d) return;
  document.getElementById("adjustDrugId").value = d.id;
  document.getElementById("adjustDrugName").textContent = d.name;
  document.getElementById("adjustCurrent").textContent = d.quantity;
  document.getElementById("a_new_count").value = "";
  document.getElementById("a_reason").value = "";
  document.getElementById("adjustPreview").classList.add("d-none");
  new bootstrap.Modal(document.getElementById("adjustModal")).show();
}

// Show the difference as they type, so the correction being recorded is
// explicit rather than implied.
document.getElementById("a_new_count").addEventListener("input", function () {
  const current = parseInt(
    document.getElementById("adjustCurrent").textContent,
    10
  );
  const next = parseInt(this.value, 10);
  const box = document.getElementById("adjustPreview");
  if (isNaN(next)) {
    box.classList.add("d-none");
    return;
  }
  const diff = next - current;
  box.classList.remove("d-none");
  box.innerHTML =
    diff === 0
      ? "No change — nothing will be recorded."
      : `Recording an adjustment of <strong>${
          diff > 0 ? "+" : ""
        }${diff}</strong> (${current} → ${next}).`;
});

document.getElementById("saveAdjustBtn").onclick = async function () {
  const id = document.getElementById("adjustDrugId").value;
  const newCount = parseInt(document.getElementById("a_new_count").value, 10);
  const reason = document.getElementById("a_reason").value.trim();

  if (isNaN(newCount) || newCount < 0) {
    alert("Enter the actual count on the shelf.");
    return;
  }
  if (!reason) {
    alert("A reason is required for a stock correction.");
    return;
  }

  const response = await authFetch(`/drug/${id}/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_count: newCount, reason: reason }),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("Only a super admin can correct stock counts.");
    return;
  }
  if (response.ok) {
    bootstrap.Modal.getInstance(document.getElementById("adjustModal")).hide();
    loadDrugs();
  } else {
    const data = await response.json().catch(() => ({}));
    alert(data.detail || "Could not record the correction.");
  }
};

// ---------- history ----------

async function openHistory(id) {
  const d = findDrug(id);
  if (!d) return;
  document.getElementById("historyDrugName").textContent = d.name;
  document.getElementById(
    "historyBody"
  ).innerHTML = `<p class="text-muted">Loading...</p>`;
  new bootstrap.Modal(document.getElementById("historyModal")).show();

  const response = await authFetch(`/drug/${id}/transactions`);
  if (!response || !response.ok) {
    document.getElementById(
      "historyBody"
    ).innerHTML = `<p class="text-muted">Could not load history.</p>`;
    return;
  }
  const items = await response.json();

  if (!Array.isArray(items) || items.length === 0) {
    document.getElementById(
      "historyBody"
    ).innerHTML = `<p class="text-muted">No stock movements recorded yet.</p>`;
    return;
  }

  const label = {
    stock_in: '<span class="badge bg-success">Stock in</span>',
    dispense: '<span class="badge bg-primary">Dispensed</span>',
    adjustment: '<span class="badge bg-warning text-dark">Correction</span>',
  };

  document.getElementById("historyBody").innerHTML = `
    <table class="table table-sm">
      <thead><tr><th>When</th><th>Type</th><th class="text-end">Change</th>
      <th class="text-end">Balance</th><th>Reason</th></tr></thead>
      <tbody>
        ${items
          .map(
            (t) => `
          <tr>
            <td><small>${new Date(t.created_at).toLocaleString()}</small></td>
            <td>${label[t.transaction_type] || t.transaction_type}</td>
            <td class="text-end fw-bold ${
              t.change < 0 ? "text-danger" : "text-success"
            }">
              ${t.change > 0 ? "+" : ""}${t.change}
            </td>
            <td class="text-end"><small>${t.quantity_before} → ${
              t.quantity_after
            }</small></td>
            <td><small class="text-muted">${t.reason || "—"}</small></td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

// ---------- filter buttons ----------

function setFilter(name, buttonId) {
  currentFilter = name;
  ["filterAll", "filterReview", "filterLow"].forEach((id) =>
    document.getElementById(id).classList.remove("active")
  );
  document.getElementById(buttonId).classList.add("active");
  loadDrugs();
}

document.getElementById("filterAll").onclick = () =>
  setFilter("all", "filterAll");
document.getElementById("filterReview").onclick = () =>
  setFilter("review", "filterReview");
document.getElementById("filterLow").onclick = () =>
  setFilter("low", "filterLow");

document.getElementById("searchInput").addEventListener("input", applyFilters);
document
  .getElementById("categoryFilter")
  .addEventListener("change", applyFilters);

// ---------- initial load ----------
loadDrugs();
