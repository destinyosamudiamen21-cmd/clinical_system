let selectedPatient = null;

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
    .map(
      (p) => `
    <button class="list-group-item list-group-item-action w-100 text-start border rounded mb-1"
            onclick="selectPatient(${p.id}, '${p.full_name.replace(
        /'/g,
        "\\'"
      )}')">
      <strong>${p.full_name}</strong>
      <span class="text-muted small ms-2">${p.age ?? "—"} yrs · ${
        p.phone_number ?? "—"
      }</span>
    </button>`
    )
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

  const meds = data.medications || [];
  document.getElementById("prescriptionResult").innerHTML = `
    <div class="card shadow-sm border-0 border-start border-4 border-success">
      <div class="card-body">
        <h6 class="fw-bold mb-3">Prescription for ${selectedPatient.name}</h6>
        ${
          meds.length === 0
            ? `<p class="text-muted">No medications on this prescription.</p>`
            : `<table class="table table-sm mb-0">
              <thead><tr><th>Drug</th><th>Dose</th><th>Route</th><th>Frequency</th></tr></thead>
              <tbody>
                ${meds
                  .map(
                    (m) => `
                  <tr>
                    <td><strong>${m.drug}</strong></td>
                    <td>${m.dose}</td>
                    <td>${m.route}</td>
                    <td>${m.frequency}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>`
        }
      </div>
    </div>`;
}

document.getElementById("searchBtn").onclick = searchPatients;
document.getElementById("lookupBtn").onclick = lookupPrescription;

// Enter key on either input triggers its action — pharmacists work fast
document.getElementById("patientSearch").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchPatients();
});
document.getElementById("codeInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") lookupPrescription();
});
