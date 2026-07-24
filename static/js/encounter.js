// Get patient_id from the URL (e.g. /encounter-page/5 -> 5)
const patientId = window.location.pathname.split("/").pop();

let showingArchivedEnc = false;

// Load this patient's active encounters (visits)
async function loadEncounters() {
  const response = await authFetch(`/encounter/patient/${patientId}`);
  if (!response || !response.ok) return;
  const encounters = await response.json();

  const list = document.getElementById("encountersList");
  list.innerHTML = "";

  if (!Array.isArray(encounters) || encounters.length === 0) {
    list.innerHTML = `<div class="text-muted p-3">No visits yet. Click "New Encounter" to start one.</div>`;
    return;
  }

  encounters.forEach((enc) => {
    const item = document.createElement("div");
    item.className =
      "list-group-item d-flex justify-content-between align-items-center";
    item.innerHTML = `
      <a href="/encounter-detail/${
        enc.id
      }" class="text-decoration-none flex-grow-1">
        <strong>${new Date(enc.encounter_date).toLocaleDateString()}</strong>
        <span class="text-muted ms-2">${enc.ward_clinic || ""}</span>
      </a>
      <div>
        <span class="badge ${
          enc.status === "open" ? "bg-success" : "bg-secondary"
        } me-2">${enc.status}</span>
        <button class="btn btn-sm btn-outline-danger" onclick="archiveEncounter(${
          enc.id
        })">Archive</button>
      </div>
    `;
    list.appendChild(item);
  });
}

// Load archived encounters for this patient
async function loadArchivedEncounters() {
  const response = await authFetch(`/encounter/patient/${patientId}/archived`);
  if (!response || !response.ok) {
    document.getElementById(
      "encountersList"
    ).innerHTML = `<div class="text-muted p-3">Could not load archived encounters.</div>`;
    return;
  }
  const encounters = await response.json();

  const list = document.getElementById("encountersList");
  list.innerHTML = "";

  if (!Array.isArray(encounters) || encounters.length === 0) {
    list.innerHTML = `<div class="text-muted p-3">No archived encounters.</div>`;
    return;
  }

  encounters.forEach((enc) => {
    const item = document.createElement("div");
    item.className =
      "list-group-item d-flex justify-content-between align-items-center bg-light";
    item.innerHTML = `
      <div>
        <strong>${new Date(enc.encounter_date).toLocaleDateString()}</strong>
        <span class="text-muted ms-2">${enc.ward_clinic || ""}</span>
      </div>
      <button class="btn btn-sm btn-success" onclick="restoreEncounter(${
        enc.id
      })">Restore</button>
    `;
    list.appendChild(item);
  });
}

// Archive an encounter (admin only)
async function archiveEncounter(id) {
  if (!confirm("Archive this encounter? It can be restored later.")) return;
  const response = await authFetch(`/encounter/${id}/archive`, {
    method: "PATCH",
  });
  if (!response) return;
  if (response.status === 403) {
    alert("Only admins can archive encounters.");
    return;
  }
  if (response.ok) {
    loadEncounters();
  } else {
    alert("Could not archive encounter.");
  }
}

// Restore an archived encounter (admin only)
async function restoreEncounter(id) {
  const response = await authFetch(`/encounter/${id}/restore`, {
    method: "PATCH",
  });
  if (!response) return;
  if (response.status === 403) {
    alert("Only admins can restore encounters.");
    return;
  }
  if (response.ok) {
    loadArchivedEncounters();
  } else {
    alert("Could not restore encounter.");
  }
}

// Create a new encounter for this patient
document.getElementById("newEncounterBtn").onclick = async function () {
  const ward = prompt("Ward / Clinic (optional):") || null;

  const response = await authFetch("/encounter/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: parseInt(patientId),
      ward_clinic: ward,
    }),
  });
  if (!response) return;

  if (response.status === 403) {
    alert("You don't have permission to create an encounter.");
    return;
  }
  if (response.ok) {
    loadEncounters();
  } else {
    alert("Could not create encounter.");
  }
};

// Toggle between active and archived views
document.getElementById("viewArchivedEncBtn").onclick = function () {
  showingArchivedEnc = !showingArchivedEnc;
  this.textContent = showingArchivedEnc ? "View Active" : "View Archived";
  if (showingArchivedEnc) {
    loadArchivedEncounters();
  } else {
    loadEncounters();
  }
};

loadEncounters();
