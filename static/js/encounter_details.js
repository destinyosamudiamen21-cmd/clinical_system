const encounterId = window.location.pathname.split("/").pop();

// Load the clerking note for this encounter (if it exists)
async function loadClerking() {
  const response = await authFetch(`/clerking/${encounterId}`);
  if (!response) return;
  const note = await response.json();

  const viewDiv = document.getElementById("clerkingView");
  const formDiv = document.getElementById("clerkingForm");

  if (note && note.id) {
    // A clerking note exists -> show it (read-only view)
    viewDiv.innerHTML = `
      <div class="card"><div class="card-body">
        <p><strong>Presenting Complaints:</strong> ${note.presenting_complaints}</p>
        <p><strong>History:</strong> ${note.history}</p>
        <p><strong>Examination:</strong> ${note.examination}</p>
        <p><strong>Assessment:</strong> ${note.assessment}</p>
        <p><strong>Diagnosis:</strong> ${note.diagnosis}</p>
        <p><strong>Investigations:</strong> ${note.investigations}</p>
        <p><strong>Treatment Plan:</strong> ${note.treatment_plan}</p>
        <p><strong>Follow-up:</strong> ${note.follow_up}</p>
      </div></div>`;
    formDiv.style.display = "none";
  } else {
    // No note yet -> show the form to write one
    viewDiv.innerHTML = `<p class="text-muted">No clerking note yet.</p>`;
    formDiv.style.display = "block";
  }
}

// Save a new clerking note
document.getElementById("saveClerkingBtn").onclick = async function () {
  const body = {
    encounter_id: parseInt(encounterId),
    presenting_complaints: document.getElementById("c_complaints").value,
    history: document.getElementById("c_history").value,
    examination: document.getElementById("c_examination").value,
    assessment: document.getElementById("c_assessment").value,
    diagnosis: document.getElementById("c_diagnosis").value,
    investigations: document.getElementById("c_investigations").value,
    treatment_plan: document.getElementById("c_treatment").value,
    follow_up: document.getElementById("c_followup").value,
  };

  const response = await authFetch("/clerking/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;

  if (response.status === 403) {
    alert("Only doctors can write clerking notes.");
    return;
  }
  if (response.ok) {
    loadClerking(); // refresh -> now shows the saved note
  } else {
    alert("Could not save clerking note.");
  }
};

loadClerking();

// ---------- TAB SWITCHING ----------
function showTab(tab) {
  document
    .querySelectorAll(".doc-section")
    .forEach((s) => (s.style.display = "none"));
  document.getElementById(tab + "Section").style.display = "block";
  if (tab === "clerking") loadClerking();
  if (tab === "vitals") loadVitals();
  if (tab === "nursing") loadNursing();
  if (tab === "progress") loadProgress();
  if (tab === "medication") loadMedication();
  if (tab === "fluid") loadFluid();
  if (tab === "procedure") loadProcedure();
  if (tab === "discharge") loadDischarge();
}

// ---------- VITALS ----------
// Simple status logic: returns "Normal" / "High" / "Low" + a bootstrap color
function vitalStatus(type, value) {
  if (value == null || value === "") return { label: "—", color: "secondary" };
  const ranges = {
    temperature: [36.1, 37.2],
    pulse: [60, 100],
    respiratory_rate: [12, 20],
    spo2: [95, 100],
    pain_score: [0, 3],
  };
  const r = ranges[type];
  if (!r) return { label: "", color: "light" }; // no range (weight, height, bmi, bp)
  if (value < r[0]) return { label: "Low", color: "warning" };
  if (value > r[1]) return { label: "High", color: "danger" };
  return { label: "Normal", color: "success" };
}

function vitalCard(icon, title, value, unit, status) {
  return `
    <div class="col-md-4 col-lg-3">
      <div class="card h-100 shadow-sm border-0">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <small class="text-muted">${title}</small>
            <span class="badge bg-${status.color}">${status.label}</span>
          </div>
          <h4 class="fw-bold mb-0 mt-2">${
            value ?? "—"
          } <small class="text-muted" style="font-size:0.6em">${unit}</small></h4>
        </div>
      </div>
    </div>`;
}

async function loadVitals() {
  const response = await authFetch(`/vitals/${encounterId}`);
  if (!response) return;
  const readings = await response.json();

  const cards = document.getElementById("vitalsCards");
  const history = document.getElementById("vitalsHistory");

  if (!readings || readings.length === 0) {
    cards.innerHTML = `<p class="text-muted">No vitals recorded yet.</p>`;
    history.innerHTML = "";
    return;
  }

  // newest reading -> show in cards
  const latest = readings[readings.length - 1];
  cards.innerHTML =
    vitalCard(
      "",
      "Temperature",
      latest.temperature,
      "°C",
      vitalStatus("temperature", latest.temperature)
    ) +
    vitalCard(
      "",
      "Pulse",
      latest.pulse,
      "bpm",
      vitalStatus("pulse", latest.pulse)
    ) +
    vitalCard(
      "",
      "Resp. Rate",
      latest.respiratory_rate,
      "/min",
      vitalStatus("respiratory_rate", latest.respiratory_rate)
    ) +
    vitalCard("", "Blood Pressure", latest.blood_pressure, "mmHg", {
      label: "",
      color: "light",
    }) +
    vitalCard("", "SpO₂", latest.spo2, "%", vitalStatus("spo2", latest.spo2)) +
    vitalCard("", "Weight", latest.weight, "kg", {
      label: "",
      color: "light",
    }) +
    vitalCard("", "Height", latest.height, "cm", {
      label: "",
      color: "light",
    }) +
    vitalCard("", "BMI", latest.bmi, "", { label: "", color: "light" }) +
    vitalCard(
      "",
      "Pain Score",
      latest.pain_score,
      "/10",
      vitalStatus("pain_score", latest.pain_score)
    );

  // history table of all readings
  history.innerHTML = `
    <table class="table table-sm">
      <thead><tr><th>Time</th><th>Temp</th><th>Pulse</th><th>BP</th><th>SpO₂</th></tr></thead>
      <tbody>
        ${readings
          .map(
            (r) => `
          <tr>
            <td>${new Date(r.created_at).toLocaleString()}</td>
            <td>${r.temperature ?? "—"}</td>
            <td>${r.pulse ?? "—"}</td>
            <td>${r.blood_pressure ?? "—"}</td>
            <td>${r.spo2 ?? "—"}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

// show/hide the form
document.getElementById("showVitalsFormBtn").onclick = () => {
  document.getElementById("vitalsForm").style.display = "block";
};
document.getElementById("cancelVitalsBtn").onclick = () => {
  document.getElementById("vitalsForm").style.display = "none";
};

// save new vitals
document.getElementById("saveVitalsBtn").onclick = async function () {
  const num = (id) => {
    const v = document.getElementById(id).value;
    return v === "" ? null : parseFloat(v);
  };

  const body = {
    encounter_id: parseInt(encounterId),
    temperature: num("v_temperature"),
    pulse: num("v_pulse"),
    respiratory_rate: num("v_respiratory_rate"),
    blood_pressure: document.getElementById("v_blood_pressure").value || null,
    spo2: num("v_spo2"),
    weight: num("v_weight"),
    height: num("v_height"),
    bmi: num("v_bmi"),
    pain_score: num("v_pain_score"),
  };

  const response = await authFetch("/vitals/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;

  if (response.status === 403) {
    alert("You don't have permission to record vitals.");
    return;
  }
  if (response.ok) {
    document.getElementById("vitalsForm").style.display = "none";
    loadVitals(); // refresh -> new reading appears
  } else {
    alert("Could not save vitals.");
  }
};

// ---------- NURSING (one-per-encounter, like clerking) ----------
async function loadNursing() {
  const response = await authFetch(`/nursing/${encounterId}`);
  if (!response) return;
  const note = await response.json();

  const viewDiv = document.getElementById("nursingView");
  const formDiv = document.getElementById("nursingForm");

  if (note && note.id) {
    viewDiv.innerHTML = `
      <div class="card"><div class="card-body">
        <p><strong>Chief Complaint:</strong> ${note.chief_complaint}</p>
        <p><strong>Nursing Assessment:</strong> ${note.nursing_assessment}</p>
        <p><strong>Nursing Diagnosis:</strong> ${note.nursing_diagnosis}</p>
        <p><strong>Care Plan:</strong> ${note.care_plan}</p>
        <p><strong>Evaluation:</strong> ${note.evaluation}</p>
      </div></div>`;
    formDiv.style.display = "none";
  } else {
    viewDiv.innerHTML = `<p class="text-muted">No nursing assessment yet.</p>`;
    formDiv.style.display = "block";
  }
}

document.getElementById("saveNursingBtn").onclick = async function () {
  const body = {
    encounter_id: parseInt(encounterId),
    chief_complaint: document.getElementById("n_chief_complaint").value,
    nursing_assessment: document.getElementById("n_nursing_assessment").value,
    nursing_diagnosis: document.getElementById("n_nursing_diagnosis").value,
    care_plan: document.getElementById("n_care_plan").value,
    evaluation: document.getElementById("n_evaluation").value,
  };

  const response = await authFetch("/nursing/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;

  if (response.status === 403) {
    alert("You don't have permission to write a nursing assessment.");
    return;
  }
  if (response.ok) {
    loadNursing();
  } else {
    alert("Could not save nursing assessment.");
  }
};

// ---------- PROGRESS NOTES (list pattern) ----------
async function loadProgress() {
  const response = await authFetch(`/progress/${encounterId}`);
  if (!response) return;
  const notes = await response.json();

  const list = document.getElementById("progressList");
  if (!notes || notes.length === 0) {
    list.innerHTML = `<p class="text-muted">No progress notes yet.</p>`;
    return;
  }

  // newest first, each note as a card
  list.innerHTML = notes
    .slice()
    .reverse()
    .map(
      (n) => `
    <div class="card shadow-sm border-0 mb-2">
      <div class="card-body">
        <small class="text-muted">${new Date(
          n.created_at
        ).toLocaleString()}</small>
        <p class="mb-1"><strong>S:</strong> ${n.subjective}</p>
        <p class="mb-1"><strong>O:</strong> ${n.objective}</p>
        <p class="mb-1"><strong>A:</strong> ${n.assessment}</p>
        <p class="mb-0"><strong>P:</strong> ${n.plan}</p>
      </div>
    </div>`
    )
    .join("");
}

document.getElementById("showProgressFormBtn").onclick = () => {
  document.getElementById("progressForm").style.display = "block";
};
document.getElementById("cancelProgressBtn").onclick = () => {
  document.getElementById("progressForm").style.display = "none";
};

document.getElementById("saveProgressBtn").onclick = async function () {
  const body = {
    encounter_id: parseInt(encounterId),
    subjective: document.getElementById("p_subjective").value,
    objective: document.getElementById("p_objective").value,
    assessment: document.getElementById("p_assessment").value,
    plan: document.getElementById("p_plan").value,
  };
  const response = await authFetch("/progress/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("You don't have permission to add progress notes.");
    return;
  }
  if (response.ok) {
    document.getElementById("progressForm").style.display = "none";
    document.getElementById("p_subjective").value = "";
    document.getElementById("p_objective").value = "";
    document.getElementById("p_assessment").value = "";
    document.getElementById("p_plan").value = "";
    loadProgress();
  } else {
    alert("Could not save progress note.");
  }
};

// ---------- MEDICATION (list pattern, card display) ----------
async function loadMedication() {
  const response = await authFetch(`/medication/${encounterId}`);
  if (!response) return;

  if (!response.ok) {
    // ← handle 404/error
    document.getElementById(
      "medicationList"
    ).innerHTML = `<p class="text-muted">Could not load medications.</p>`;
    return;
  }

  const meds = await response.json();

  if (!Array.isArray(meds) || meds.length === 0) {
    // ← guard against non-array
    document.getElementById(
      "medicationList"
    ).innerHTML = `<p class="text-muted">No medications prescribed yet.</p>`;
    return;
  }

  document.getElementById("medicationList").innerHTML = meds
    .map(
      (m) => `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm border-0 border-start border-4 border-primary">
        <div class="card-body">
          <h6 class="fw-bold mb-1">${m.drug}</h6>
          <p class="mb-1 text-muted small">${m.dose} • ${m.route} • ${
        m.frequency
      }</p>
          <p class="mb-0 small">
            ${
              m.start_date
                ? "Start: " + new Date(m.start_date).toLocaleDateString()
                : ""
            }
            ${
              m.stop_date
                ? " → Stop: " + new Date(m.stop_date).toLocaleDateString()
                : ""
            }
          </p>
        </div>
      </div>
    </div>`
    )
    .join("");
}

document.getElementById("showMedFormBtn").onclick = () => {
  document.getElementById("medicationForm").style.display = "block";
};
document.getElementById("cancelMedBtn").onclick = () => {
  document.getElementById("medicationForm").style.display = "none";
};

document.getElementById("saveMedBtn").onclick = async function () {
  const body = {
    encounter_id: parseInt(encounterId),
    drug: document.getElementById("m_drug").value,
    dose: document.getElementById("m_dose").value,
    route: document.getElementById("m_route").value,
    frequency: document.getElementById("m_frequency").value,
    start_date: document.getElementById("m_start_date").value || null,
    stop_date: document.getElementById("m_stop_date").value || null,
  };
  const response = await authFetch("/medication/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("Only doctors can prescribe medication.");
    return;
  }
  if (response.ok) {
    document.getElementById("medicationForm").style.display = "none";
    [
      "m_drug",
      "m_dose",
      "m_route",
      "m_frequency",
      "m_start_date",
      "m_stop_date",
    ].forEach((id) => (document.getElementById(id).value = ""));
    loadMedication();
  } else {
    alert("Could not save medication.");
  }
};

// ---------- FLUID BALANCE (list, with running totals) ----------
async function loadFluid() {
  const response = await authFetch(`/fluid/${encounterId}`);
  if (!response || !response.ok) return;
  const entries = await response.json();

  const table = document.getElementById("fluidTable");
  const summary = document.getElementById("fluidSummary");

  if (!Array.isArray(entries) || entries.length === 0) {
    table.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No fluid entries yet.</td></tr>`;
    summary.innerHTML = "";
    return;
  }

  let totalIn = 0,
    totalOut = 0;
  entries.forEach((e) => {
    totalIn += e.intake || 0;
    totalOut += e.output || 0;
  });
  const net = totalIn - totalOut;

  summary.innerHTML = `
    <div class="col-md-4"><div class="card shadow-sm border-0 border-start border-4 border-info"><div class="card-body"><small class="text-muted">Total Intake</small><h4 class="fw-bold mb-0">${totalIn} ml</h4></div></div></div>
    <div class="col-md-4"><div class="card shadow-sm border-0 border-start border-4 border-warning"><div class="card-body"><small class="text-muted">Total Output</small><h4 class="fw-bold mb-0">${totalOut} ml</h4></div></div></div>
    <div class="col-md-4"><div class="card shadow-sm border-0 border-start border-4 border-${
      net >= 0 ? "success" : "danger"
    }"><div class="card-body"><small class="text-muted">Net Balance</small><h4 class="fw-bold mb-0">${net} ml</h4></div></div></div>`;

  table.innerHTML = entries
    .map(
      (e) => `
    <tr>
      <td>${e.time ? new Date(e.time).toLocaleString() : "—"}</td>
      <td>${e.intake ?? "—"}</td>
      <td>${e.output ?? "—"}</td>
      <td>${e.balance ?? "—"}</td>
    </tr>`
    )
    .join("");
}

document.getElementById("showFluidFormBtn").onclick = () =>
  (document.getElementById("fluidForm").style.display = "block");
document.getElementById("cancelFluidBtn").onclick = () =>
  (document.getElementById("fluidForm").style.display = "none");

document.getElementById("saveFluidBtn").onclick = async function () {
  const num = (id) => {
    const v = document.getElementById(id).value;
    return v === "" ? null : parseFloat(v);
  };
  const body = {
    encounter_id: parseInt(encounterId),
    time: document.getElementById("f_time").value || null,
    intake: num("f_intake"),
    output: num("f_output"),
    balance: num("f_balance"),
  };
  const response = await authFetch("/fluid/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("You don't have permission to record fluid balance.");
    return;
  }
  if (response.ok) {
    document.getElementById("fluidForm").style.display = "none";
    ["f_time", "f_intake", "f_output", "f_balance"].forEach(
      (id) => (document.getElementById(id).value = "")
    );
    loadFluid();
  } else {
    alert("Could not save fluid entry.");
  }
};

// ---------- PROCEDURE (list, cards) ----------
async function loadProcedure() {
  const response = await authFetch(`/procedure/${encounterId}`);
  if (!response || !response.ok) return;
  const procs = await response.json();

  const list = document.getElementById("procedureList");
  if (!Array.isArray(procs) || procs.length === 0) {
    list.innerHTML = `<p class="text-muted">No procedures recorded yet.</p>`;
    return;
  }

  list.innerHTML = procs
    .slice()
    .reverse()
    .map(
      (p) => `
    <div class="card shadow-sm border-0 border-start border-4 border-primary mb-2">
      <div class="card-body">
        <small class="text-muted">${new Date(
          p.created_at
        ).toLocaleString()}</small>
        <p class="mb-1"><strong>Indication:</strong> ${p.indication}</p>
        <p class="mb-1"><strong>Procedure:</strong> ${p.procedure}</p>
        <p class="mb-1"><strong>Findings:</strong> ${p.findings}</p>
        <p class="mb-1"><strong>Complications:</strong> ${
          p.complications || "None"
        }</p>
        <p class="mb-0"><strong>Plan:</strong> ${p.plan}</p>
      </div>
    </div>`
    )
    .join("");
}

document.getElementById("showProcedureFormBtn").onclick = () =>
  (document.getElementById("procedureForm").style.display = "block");
document.getElementById("cancelProcedureBtn").onclick = () =>
  (document.getElementById("procedureForm").style.display = "none");

document.getElementById("saveProcedureBtn").onclick = async function () {
  const body = {
    encounter_id: parseInt(encounterId),
    indication: document.getElementById("pr_indication").value,
    procedure: document.getElementById("pr_procedure").value,
    findings: document.getElementById("pr_findings").value,
    complications: document.getElementById("pr_complications").value || null,
    plan: document.getElementById("pr_plan").value,
  };
  const response = await authFetch("/procedure/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("You don't have permission to record procedures.");
    return;
  }
  if (response.ok) {
    document.getElementById("procedureForm").style.display = "none";
    [
      "pr_indication",
      "pr_procedure",
      "pr_findings",
      "pr_complications",
      "pr_plan",
    ].forEach((id) => (document.getElementById(id).value = ""));
    loadProcedure();
  } else {
    alert("Could not save procedure.");
  }
};

// ---------- DISCHARGE (one per encounter, like clerking) ----------
async function loadDischarge() {
  const response = await authFetch(`/discharge/${encounterId}`);
  if (!response || !response.ok) return;
  const note = await response.json();

  const viewDiv = document.getElementById("dischargeView");
  const formDiv = document.getElementById("dischargeForm");

  if (note && note.id) {
    viewDiv.innerHTML = `
      <div class="card shadow-sm border-0"><div class="card-body">
        <h5 class="mb-3">Discharge Summary</h5>
        <p><strong>Diagnosis:</strong> ${note.diagnosis}</p>
        <p><strong>Hospital Course:</strong> ${note.hospital_course}</p>
        <p><strong>Discharge Medications:</strong> ${note.discharge_medications}</p>
        <p><strong>Follow-up:</strong> ${note.follow_up}</p>
      </div></div>`;
    formDiv.style.display = "none";
  } else {
    viewDiv.innerHTML = `<p class="text-muted">No discharge summary yet.</p>`;
    formDiv.style.display = "block";
  }
}

document.getElementById("saveDischargeBtn").onclick = async function () {
  const body = {
    encounter_id: parseInt(encounterId),
    diagnosis: document.getElementById("d_diagnosis").value,
    hospital_course: document.getElementById("d_hospital_course").value,
    discharge_medications: document.getElementById("d_discharge_medications")
      .value,
    follow_up: document.getElementById("d_follow_up").value,
  };
  const response = await authFetch("/discharge/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("Only doctors can write discharge summaries.");
    return;
  }
  if (response.ok) {
    loadDischarge();
  } else {
    alert("Could not save discharge summary.");
  }
};
