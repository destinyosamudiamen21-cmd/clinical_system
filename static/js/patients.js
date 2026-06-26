const tableBody = document.getElementById("patientsTableBody");
const searchInput = document.getElementById("SearchInput");

// Render patients into table
function renderPatients(patients) {
  tableBody.innerHTML = "";

  if (patients.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    No patients found
                </td>
            </tr>`;
    return;
  }

  patients.forEach((patient) => {
    const row = `
            <tr>
                <td>${patient.id}</td>
                <td>${patient.full_name}</td>
                <td>${patient.age}</td>
                <td>${patient.gender}</td>
                <td>${patient.phone_number}</td>
                <td>
                    <button class="btn btn-sm btn-danger" 
                        onclick="deletePatient(${patient.id})">
                        Delete
                    </button>
                </td>
            </tr>`;
    tableBody.innerHTML += row;
  });
}

// Load all patients on page open
async function loadPatients() {
  const response = await fetch("http://127.0.0.1:8000/patient/");
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

  const response = await fetch(
    `http://127.0.0.1:8000/patient/name?name=${name}`
  );
  const patients = await response.json();
  renderPatients(patients);
});

// Delete patient
async function deletePatient(id) {
  const confirm = window.confirm("Delete this patient?");
  if (!confirm) return;

  await fetch(`http://127.0.0.1:8000/patient/${id}`, {
    method: "DELETE",
  });
  loadPatients();
}

loadPatients();
