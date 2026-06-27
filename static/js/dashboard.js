async function loadDashboardstats() {
  // Fetch all patients
  const patientResponse = await fetch("/patient/");
  const patients = await patientResponse.json();
  document.getElementById("total-patients").textContent = patients.length;

  // Fetch all Appointments
  const appointmentResponse = await fetch("/appointment/");
  const appointments = await appointmentResponse.json();
  document.getElementById("total-appointments").textContent =
    appointments.length;

  // Fetch today's appointments
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) =>
    a.appointment_date.startsWith(today)
  );
  document.getElementById("todays-appointments").textContent =
    todayAppointments.length;
  new Chart(document.getElementById("statsChart"), {
    type: "bar",
    data: {
      labels: ["Patients", "Appointments"],
      datasets: [
        {
          data: [patients.length, appointments.length],
          backgroundColor: ["#0d6efd", "#198754"],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}
loadDashboardstats();

const quotes = [
  {
    text: "The good physician treats the disease; the great physician treats the patient who has the disease.",
    author: "William Osler",
  },
  {
    text: "Wherever the art of medicine is loved, there is also a love of humanity.",
    author: "Hippocrates",
  },
  {
    text: "Take care of your body. It's the only place you have to live.",
    author: "Jim Rohn",
  },
];

let currentIndex = 0;
const quoteTextEl = document.getElementById("quote-text");
const quoteAuthorEl = document.getElementById("quote-author");
const quoteBannerEl = document.getElementById("quote-banner");

function renderQuote(index) {
  quoteTextEl.textContent = quotes[index].text;
  quoteAuthorEl.textContent = "— " + quotes[index].author;
}

function cycleQuote() {
  quoteBannerEl.classList.add("fade-out");
  setTimeout(() => {
    currentIndex = (currentIndex + 1) % quotes.length;
    renderQuote(currentIndex);
    quoteBannerEl.classList.remove("fade-out");
  }, 600);
}

document.addEventListener("DOMContentLoaded", () => {
  renderQuote(currentIndex);
  setInterval(cycleQuote, 5000);
});

let currentDate = new Date();

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  document.getElementById("calendarTitle").textContent =
    monthNames[month] + " " + year;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = '<div class="row text-center mb-2">';
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  days.forEach(
    (d) => (html += `<div class="col fw-bold text-muted small">${d}</div>`)
  );
  html += '</div><div class="row text-center">';

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="col"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    html += `<div class="col p-1"><span class="${
      isToday ? "bg-primary text-white rounded-circle px-2 py-1" : ""
    }">${d}</span></div>`;
    if ((firstDay + d) % 7 === 0) html += '</div><div class="row text-center">';
  }

  html += "</div>";
  document.getElementById("calendarGrid").innerHTML = html;
}

function changeMonth(dir) {
  currentDate.setMonth(currentDate.getMonth() + dir);
  renderCalendar();
}

renderCalendar();
