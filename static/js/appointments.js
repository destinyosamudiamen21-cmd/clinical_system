async function loadAppointments() {
  const response = await fetch("/appointment/");
  const appointments = await response.json();

  const tbody = document.getElementById("appointments-table-body");
  tbody.innerHTML = "";

  for (const apt of appointments) {
    const patientResponse = await fetch("/patient/" + apt.patient_id);
    const patient = await patientResponse.json();
    const patientName = patient ? patient.full_name : apt.patient_id;

    const row = `<tr style="cursor:pointer" onclick="openEditModal(${JSON.stringify(
      apt
    ).replace(/"/g, "&quot;")})">
      <td>${patientName}</td>
      <td>${new Date(apt.appointment_date).toLocaleString()}</td>
      <td>${apt.doctor_name}</td>
      <td>${apt.reason}</td>
      <td><span class="badge ${
        apt.status === "Scheduled"
          ? "bg-success"
          : apt.status === "Cancelled"
          ? "bg-danger"
          : "bg-secondary"
      }">${apt.status}</span></td>

      <td>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteAppointment(${
          apt.id
        })">Cancel</button>
      </td>
    </tr>`;
    tbody.innerHTML += row;
  }
  updateTodayAppointments(appointments);
}

loadAppointments();

let searchTimeout = null;

document.getElementById("patientSearch").addEventListener("input", function () {
  clearTimeout(searchTimeout);
  const query = this.value;

  if (query.length < 2) {
    document.getElementById("patientResults").innerHTML = "";
    return;
  }

  searchTimeout = setTimeout(async function () {
    const response = await fetch("/patient/name?name=" + query);
    const patients = await response.json();

    const resultsDiv = document.getElementById("patientResults");
    resultsDiv.innerHTML = "";

    patients.forEach(function (patient) {
      const item = document.createElement("button");
      item.className = "list-group-item list-group-item-action";
      item.textContent = patient.full_name;
      item.onclick = function () {
        document.getElementById("selectedPatientId").value = patient.id;
        document.getElementById("patientSearch").value = patient.full_name;
        resultsDiv.innerHTML = "";
      };
      resultsDiv.appendChild(item);
    });
  }, 300);
});

document.getElementById("confirmBookBtn").onclick = async function () {
  const patient_id = document.getElementById("selectedPatientId").value;
  const appointment_date = document.getElementById("appointmentDate").value;
  const doctor_name = document.getElementById("doctorName").value;
  const reason = document.getElementById("reason").value;

  if (!patient_id || !appointment_date || !doctor_name || !reason) {
    alert("Please fill in all fields");
    return;
  }

  const response = await fetch("/appointment/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: parseInt(patient_id),
      appointment_date: appointment_date,
      doctor_name: doctor_name,
      reason: reason,
      status: "Scheduled",
    }),
  });

  if (response.ok) {
    bootstrap.Modal.getInstance(document.getElementById("bookModal")).hide();
    loadAppointments();
  } else {
    alert("Booking failed");
  }
};

async function deleteAppointment(id) {
  if (!confirm("Cancel this appointment?")) return;

  const response = await fetch("/appointment/" + id, {
    method: "DELETE",
  });

  if (response.ok) {
    loadAppointments();
  } else {
    alert("Failed to cancel appointment");
  }
}

function openEditModal(apt) {
  document.getElementById("editAppointmentId").value = apt.id;
  document.getElementById("editDate").value = apt.appointment_date.slice(0, 16);
  document.getElementById("editDoctor").value = apt.doctor_name;
  document.getElementById("editReason").value = apt.reason;
  document.getElementById("editStatus").value = apt.status;

  document.getElementById("editPatientId").value = apt.patient_id;

  new bootstrap.Modal(document.getElementById("editModal")).show();
}

document.getElementById("saveEditBtn").onclick = async function () {
  const id = document.getElementById("editAppointmentId").value;
  const appointment_date = document.getElementById("editDate").value;
  const doctor_name = document.getElementById("editDoctor").value;
  const reason = document.getElementById("editReason").value;
  const status = document.getElementById("editStatus").value;

  const response = await fetch("/appointment/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: parseInt(document.getElementById("editPatientId").value),
      appointment_date: appointment_date,
      doctor_name: doctor_name,
      reason: reason,
      status: status,
    }),
  });

  if (response.ok) {
    bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    loadAppointments();
  } else {
    alert("Failed to save changes");
  }
};

document.getElementById("search-input").addEventListener("input", function () {
  const query = this.value.toLowerCase();
  const rows = document.querySelectorAll("#appointments-table-body tr");

  rows.forEach(function (row) {
    const patientName = row.cells[0].textContent.toLowerCase();
    if (patientName.includes(query)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});

function updateTodayAppointments(appointments) {
  const today = new Date().toDateString();
  const todayApts = appointments.filter(
    (apt) => new Date(apt.appointment_date).toDateString() === today
  );

  document.getElementById("todayCount").textContent = todayApts.length;
  const list = document.getElementById("todayList");
  list.innerHTML = todayApts
    .map(
      (apt) =>
        `<small class="d-block" style="color: rgba(255,255,255,0.85)">${new Date(
          apt.appointment_date
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${
          apt.reason
        }</small>`
    )
    .join("");
}
