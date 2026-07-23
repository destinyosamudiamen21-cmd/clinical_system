// Get patient_id from the URL (e.g. /encounter-page/5 -> 5)
const patientId = window.location.pathname.split("/").pop();

// Load this patient's encounters (visits)
async function loadEncounters() {
  const response = await authFetch(`/encounter/patient/${patientId}`);
  if (!response) return;
  const encounters = await response.json();

  const list = document.getElementById("encountersList");
  list.innerHTML = "";

  if (encounters.length === 0) {
    list.innerHTML = `<div class="text-muted p-3">No visits yet. Click "New Encounter" to start one.</div>`;
    return;
  }

  // newest first (your backend can also order this)
  encounters.forEach((enc) => {
    const item = document.createElement("a");
    item.href = `/encounter-detail/${enc.id}`;
    item.className =
      "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
    item.innerHTML = `
      <div>
        <strong>${new Date(enc.encounter_date).toLocaleDateString()}</strong>
        <span class="text-muted ms-2">${enc.ward_clinic || ""}</span>
      </div>
      <span class="badge ${
        enc.status === "open" ? "bg-success" : "bg-secondary"
      }">${enc.status}</span>
    `;
    list.appendChild(item);
  });
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
    loadEncounters(); // refresh the list
  } else {
    alert("Could not create encounter.");
  }
};

loadEncounters();
