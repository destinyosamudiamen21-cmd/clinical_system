let selectedPatient = null;
let currentPrescriptionId = null;

// ---------- 1. find the patient ----------

async function searchPatients() {
  const name = document.getElementById("patientSearch").value.trim();
  if (!name) return;

  const response = await authFetch(
    `/prescription/search-patient?name=${encodeURIComponent(name)}`
  );
  if (!response) return;
  if (response.status === 403) {
    document.getElementById(
      "patientResults"
    ).innerHTML = `<p class="text-danger small">You don't have pharmacy access.</p>`;
    return;
  }
  if (!response.ok) return;

  const patients = await response.json();
  const box = document.getElementById("patientResults");

  if (!Array.isArray(patients) || patients.length === 0) {
    box.innerHTML = `<p class="text-muted small">No patient found with that name.</p>`;
    return;
  }

  box.innerHTML = patients
    .map((p) => {
      const safeName = p.full_name.replace(/'/g, "\\'");
      return `
      <button class="list-group-item list-group-item-action w-100 text-start border rounded mb-1"
              onclick="selectPatient(${p.id}, '${safeName}')">
        <strong>${p.full_name}</strong>
        <span class="text-muted small ms-2">${p.age ?? "—"} yrs · ${
        p.phone_number ?? "—"
      }</span>
      </button>`;
    })
    .join("");
}

function selectPatient(id, name) {
  selectedPatient = { id, name };
  document.getElementById("selectedPatientName").textContent = name;
  document.getElementById("codeCard").style.display = "block";
  document.getElementById("prescriptionResult").innerHTML = "";
  document.getElementById("lookupError").textContent = "";
  document.getElementById("codeInput").value = "";
  document.getElementById("codeInput").focus();
}

// ---------- 2. enter the code ----------

async function lookupPrescription() {
  if (!selectedPatient) return;
  const code = document.getElementById("codeInput").value.trim().toUpperCase();
  const errorBox = document.getElementById("lookupError");
  errorBox.textContent = "";

  if (!code) {
    errorBox.textContent = "Enter the code from the patient's slip.";
    return;
  }

  const response = await authFetch("/prescription/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_id: selectedPatient.id, code: code }),
  });
  if (!response) return;

  const data = await response.json();
  if (!response.ok) {
    errorBox.textContent = data.detail || "Could not find that prescription.";
    document.getElementById("prescriptionResult").innerHTML = "";
    return;
  }

  currentPrescriptionId = data.prescription_id;
  loadDispensingView(data.medications);
}

// ---------- 3. dispense ----------

async function loadDispensingView(fallbackMeds) {
  const encounterId =
    fallbackMeds && fallbackMeds.length ? fallbackMeds[0].encounter_id : null;

  let rows = null;
  if (encounterId) {
    const res = await authFetch(`/prescription/dispensing/${encounterId}`);
    if (res && res.ok) rows = await res.json();
  }
  if (!Array.isArray(rows)) rows = fallbackMeds || [];

  renderDispensing(rows);
}

function renderDispensing(rows) {
  const box = document.getElementById("prescriptionResult");

  if (!rows.length) {
    box.innerHTML = `<div class="card"><div class="card-body">
      <p class="text-muted mb-0">No medications on this prescription.</p>
    </div></div>`;
    return;
  }

  const outstanding = rows.filter((r) => !r.is_dispensed);
  const done = rows.filter((r) => r.is_dispensed);

  box.innerHTML = `
    <div class="card shadow-sm border-0 border-start border-4 border-success">
      <div class="card-body">
        <h6 class="fw-bold mb-3">Prescription for ${selectedPatient.name}</h6>

        ${
          outstanding.length
            ? `
        <table class="table table-sm align-middle">
          <thead class="table-light">
            <tr>
              <th>Drug</th><th>Dose</th><th>Route</th><th>Frequency</th>
              <th class="text-end">In stock</th><th style="width:130px">Quantity</th>
            </tr>
          </thead>
          <tbody>${outstanding.map((m) => dispenseRow(m)).join("")}</tbody>
        </table>

        <div class="d-flex justify-content-between align-items-center mt-3">
          <small class="text-muted">
            Leave a quantity blank for anything you can't supply — it stays
            outstanding and the patient's code keeps working.
          </small>
          <button class="btn btn-success" id="dispenseBtn">Dispense</button>
        </div>
        <div id="dispenseError" class="text-danger small mt-2"></div>`
            : `<p class="text-success mb-0">Everything on this prescription has been dispensed.</p>`
        }

        ${
          done.length
            ? `<hr><h6 class="text-muted small text-uppercase">Already dispensed</h6>
               <ul class="list-unstyled mb-0 small">
                 ${done
                   .map(
                     (m) =>
                       `<li>✓ ${m.drug} — ${m.quantity_dispensed} unit(s)</li>`
                   )
                   .join("")}
               </ul>`
            : ""
        }
      </div>
    </div>`;

  const btn = document.getElementById("dispenseBtn");
  if (btn) btn.onclick = submitDispense;
}

function dispenseRow(m) {
  const unlinked = m.drug_id == null;
  const out = m.stock_available === 0;

  let stockCell = `<span class="text-muted small">not tracked</span>`;
  if (!unlinked && m.stock_available != null) {
    stockCell = `<span class="badge ${out ? "bg-danger" : "bg-success"}">${
      m.stock_available
    }</span>`;
  }

  return `
    <tr>
      <td>
        <strong>${m.drug}</strong>
        ${
          unlinked
            ? `<br><small class="text-warning">not linked to stock</small>`
            : ""
        }
      </td>
      <td>${m.dose || "—"}</td>
      <td>${m.route || "—"}</td>
      <td>${m.frequency || "—"}</td>
      <td class="text-end">${stockCell}</td>
      <td>
        <input type="number" min="1" class="form-control form-control-sm dispense-qty"
               data-med-id="${m.id}" placeholder="—" />
      </td>
    </tr>`;
}

async function submitDispense() {
  const errorBox = document.getElementById("dispenseError");
  errorBox.textContent = "";

  const items = [];
  document.querySelectorAll(".dispense-qty").forEach((input) => {
    const qty = parseInt(input.value, 10);
    if (!isNaN(qty) && qty > 0) {
      items.push({
        medication_id: parseInt(input.dataset.medId, 10),
        quantity: qty,
      });
    }
  });

  if (items.length === 0) {
    errorBox.textContent = "Enter a quantity for at least one drug.";
    return;
  }

  const response = await authFetch("/prescription/dispense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prescription_id: currentPrescriptionId,
      items: items,
    }),
  });
  if (!response) return;

  const data = await response.json();

  if (!response.ok) {
    errorBox.textContent = data.detail || "Could not dispense.";
    return;
  }

  alert(
    data.prescription_complete
      ? "Dispensed. Prescription complete."
      : `Dispensed. ${data.outstanding} drug(s) still outstanding — the patient's code remains valid.`
  );

  lookupPrescription();
}

// ---------- wiring ----------

document.getElementById("searchBtn").onclick = searchPatients;
document.getElementById("lookupBtn").onclick = lookupPrescription;

document.getElementById("patientSearch").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchPatients();
});
document.getElementById("codeInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") lookupPrescription();
});
