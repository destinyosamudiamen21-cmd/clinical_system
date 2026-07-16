const tableBody = document.getElementById("patientsTableBody");
const searchInput = document.getElementById("searchInput");

// Render patients into table
function renderPatients(patients) {
  tableBody.innerHTML = "";
  const role = getCurrentRole(); // read logged-in role from token
  const isAdmin = role === "admin";

  if (patients.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No patients found</td>
      </tr>`;
    return;
  }

  patients.forEach((patient) => {
    // Admin-only action buttons; others see "View only"
    const actions = isAdmin
      ? `
          <button class="btn btn-sm btn-success"
              onclick="confirmPayment(${patient.id}, '${patient.full_name}')">
            Confirm Payment
          </button>
          <button class="btn btn-sm btn-danger"
              onclick="deletePatient(${patient.id})">
            Delete
          </button>
        `
      : `<span class="text-muted small">View only</span>`;

    const row = `
      <tr>
        <td>${patient.id}</td>
        <td>
          <span style="cursor:pointer; color:#0d6efd; text-decoration:underline"
                onclick="openViewModal(${patient.id})">
            ${patient.full_name}
          </span>
        </td>
        <td>${patient.age}</td>
        <td>${patient.gender}</td>
        <td>${patient.phone_number}</td>
        <td>${actions}</td>
      </tr>`;
    tableBody.innerHTML += row;
  });
}

// Load all patients on page open
async function loadPatients() {
  const response = await authFetch("/patient/");
  if (!response) return;
  const patients = await response.json();
  renderPatients(patients);
}

// Search as you type
searchInput.addEventListener("input", async function () {
  const name = this.value.trim();
  if (name === "") {
    loadPatients();
    return;
  }
  const response = await authFetch(`/patient/name?name=${name}`);
  if (!response) return;
  const patients = await response.json();
  renderPatients(patients);
});

// Delete patient
async function deletePatient(id) {
  if (!window.confirm("Delete this patient?")) return;
  const response = await authFetch(`/patient/${id}`, { method: "DELETE" });
  if (!response) return;
  loadPatients();
}

// Confirm payment -> generate PIN
async function confirmPayment(patientId, patientName) {
  if (
    !confirm(
      `Confirm payment for ${patientName}? This generates a booking PIN.`
    )
  )
    return;

  const response = await authFetch("/payment/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_id: patientId }),
  });
  if (!response) return;

  if (response.status === 403) {
    alert("Only admins can confirm payments.");
    return;
  }
  if (response.status === 404) {
    alert("Patient not found.");
    return;
  }

  if (response.ok) {
    const payment = await response.json();
    alert(
      `Payment confirmed for ${patientName}.\n\nBooking PIN: ${payment.pin}\n\nGive this PIN to book their appointment.`
    );
  } else {
    alert("Could not confirm payment.");
  }
}

loadPatients();

// Open Register modal
document.getElementById("registerBtn").addEventListener("click", function () {
  const modal = new bootstrap.Modal(document.getElementById("registerModal"));
  modal.show();
});

// Submit registration
document
  .getElementById("submitRegister")
  .addEventListener("click", async function () {
    const patient = {
      full_name: document.getElementById("reg_full_name").value,
      age: parseInt(document.getElementById("reg_age").value),
      gender: document.getElementById("reg_gender").value,
      phone_number: document.getElementById("reg_phone").value,
      address: document.getElementById("reg_address").value,
      nationality: document.getElementById("reg_nationality").value,
      tribe: document.getElementById("reg_tribe").value,
      occupation: document.getElementById("reg_occupation").value,
      marital_status: document.getElementById("reg_marital_status").value,
      next_of_kin: document.getElementById("reg_next_of_kin").value,
      diagnosis: document.getElementById("reg_diagnosis").value || null,
    };

    const response = await authFetch("/patient/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    });
    if (!response) return;

    if (response.status === 409) {
      alert("A patient with this name and phone number already exists.");
      return;
    }

    if (response.ok) {
      bootstrap.Modal.getInstance(
        document.getElementById("registerModal")
      ).hide();
      loadPatients();
    } else {
      alert("Could not register patient.");
    }
  });

// Open View Patient Modal
async function openViewModal(patientId) {
  const response = await authFetch(`/patient/${patientId}`);
  if (!response) return;
  const p = await response.json();

  document.getElementById("viewPatientBody").innerHTML = `
    <div class="row g-3">
      <div class="col-md-6"><small class="text-muted">Full Name</small><p class="fw-bold">${
        p.full_name
      }</p></div>
      <div class="col-md-3"><small class="text-muted">Age</small><p class="fw-bold">${
        p.age
      }</p></div>
      <div class="col-md-3"><small class="text-muted">Gender</small><p class="fw-bold">${
        p.gender
      }</p></div>
      <div class="col-md-6"><small class="text-muted">Phone</small><p class="fw-bold">${
        p.phone_number
      }</p></div>
      <div class="col-md-6"><small class="text-muted">Address</small><p class="fw-bold">${
        p.address || "—"
      }</p></div>
      <div class="col-md-6"><small class="text-muted">Nationality</small><p class="fw-bold">${
        p.nationality || "—"
      }</p></div>
      <div class="col-md-6"><small class="text-muted">Tribe</small><p class="fw-bold">${
        p.tribe || "—"
      }</p></div>
      <div class="col-md-6"><small class="text-muted">Occupation</small><p class="fw-bold">${
        p.occupation || "—"
      }</p></div>
      <div class="col-md-6"><small class="text-muted">Marital Status</small><p class="fw-bold">${
        p.marital_status || "—"
      }</p></div>
      <div class="col-md-6"><small class="text-muted">Next of Kin</small><p class="fw-bold">${
        p.next_of_kin || "—"
      }</p></div>
      <div class="col-12"><small class="text-muted">Diagnosis</small><p class="fw-bold">${
        p.diagnosis || "—"
      }</p></div>
    </div>`;

  document.getElementById("editFromViewBtn").onclick = () => openEditModal(p);
  new bootstrap.Modal(document.getElementById("viewPatientModal")).show();
}

// Open Edit Patient Modal
function openEditModal(p) {
  bootstrap.Modal.getInstance(
    document.getElementById("viewPatientModal")
  ).hide();

  document.getElementById("editPatientId").value = p.id;
  document.getElementById("edit_full_name").value = p.full_name;
  document.getElementById("edit_age").value = p.age;
  document.getElementById("edit_gender").value = p.gender;
  document.getElementById("edit_phone_number").value = p.phone_number;
  document.getElementById("edit_address").value = p.address || "";
  document.getElementById("edit_nationality").value = p.nationality || "";
  document.getElementById("edit_tribe").value = p.tribe || "";
  document.getElementById("edit_occupation").value = p.occupation || "";
  document.getElementById("edit_marital_status").value = p.marital_status || "";
  document.getElementById("edit_next_of_kin").value = p.next_of_kin || "";
  document.getElementById("edit_diagnosis").value = p.diagnosis || "";

  new bootstrap.Modal(document.getElementById("editPatientModal")).show();
}

// Save updated patient
async function savePatientUpdate() {
  const patientId = document.getElementById("editPatientId").value;

  const updatedPatient = {
    full_name: document.getElementById("edit_full_name").value,
    age: parseInt(document.getElementById("edit_age").value),
    gender: document.getElementById("edit_gender").value,
    phone_number: document.getElementById("edit_phone_number").value,
    address: document.getElementById("edit_address").value,
    nationality: document.getElementById("edit_nationality").value,
    tribe: document.getElementById("edit_tribe").value,
    occupation: document.getElementById("edit_occupation").value,
    marital_status: document.getElementById("edit_marital_status").value,
    next_of_kin: document.getElementById("edit_next_of_kin").value,
    diagnosis: document.getElementById("edit_diagnosis").value || null,
  };

  const response = await authFetch(`/patient/${patientId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedPatient),
  });
  if (!response) return;

  if (response.ok) {
    bootstrap.Modal.getInstance(
      document.getElementById("editPatientModal")
    ).hide();
    loadPatients();
  }
}

// Save edit button listener
document
  .getElementById("saveEditBtn")
  .addEventListener("click", savePatientUpdate);
