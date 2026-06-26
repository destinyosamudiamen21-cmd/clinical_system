async function loadDashboardstats() {
  // Fetch all patients
  const patientResponse = await fetch("http://127.0.0.1:8000/patient/");
  const patients = await patientResponse.json();
  document.getElementById("total-patients").textContent = patients.length;

  // Fetch all Appointments
  const appointmentResponse = await fetch("http://127.0.0.1:8000/appointment/");
  const appointments = await appointmentResponse.json();
  document.getElementById("total-appointments").textContent =
    appointments.length;

  // Fetch today's appointments
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    a.appointment_date.startsWith(today)
  );
  document.getElementById("todays-appointments").textContent =
    todayAppointments.length;
}
loadDashboardstats();
