const encounterId = window.location.pathname.split("/").pop();

let currentPatientId = null;

async function loadEncounterInfo() {
  const response = await authFetch(`/encounter/${encounterId}`);
  if (!response || !response.ok) return;
  const enc = await response.json();
  currentPatientId = enc.patient_id;
}

// ---------- TAB SWITCHING ----------
function showTab(tab) {
  document
    .querySelectorAll(".doc-section")
    .forEach((s) => (s.style.display = "none"));
  document.getElementById(tab + "Section").style.display = "block";
  if (tab === "clerking") {
    loadClerking();
    loadClerkingVitals();
  }
  if (tab === "vitals") loadVitals();
  if (tab === "nursing") loadNursing();
  if (tab === "progress") loadProgress();
  if (tab == "medication") {
    loadMedication();
    loadPrescriptionCode();
  }
  if (tab === "fluid") loadFluid();
  if (tab === "procedure") loadProcedure();
  if (tab === "discharge") loadDischarge();
  if (tab === "investigation") loadInvestigation();
}

// ---------- CLERKING ----------
async function loadClerking() {
  const response = await authFetch(`/clerking/${encounterId}`);
  if (!response) return;
  const note = await response.json();

  const viewDiv = document.getElementById("clerkingView");
  const formDiv = document.getElementById("clerkingForm");

  if (note && note.id) {
    viewDiv.innerHTML = `
      <div class="card"><div class="card-body">
        <p class="text-muted mb-3"><strong>Date:</strong> ${new Date(
          note.created_at
        ).toLocaleString()}</p>
        <p><strong>Presenting Complaints:</strong> ${
          note.presenting_complaints
        }</p>
        <p><strong>History:</strong> ${note.history}</p>
        <p><strong>Examination:</strong> ${note.examination}</p>
        <p><strong>Assessment:</strong> ${note.assessment}</p>
        <p><strong>Diagnosis:</strong> ${note.diagnosis}</p>
        <p><strong>Investigations:</strong> ${note.investigations}</p>
        <p><strong>Treatment Plan:</strong> ${note.treatment_plan}</p>
        <p><strong>Follow-up:</strong> ${note.follow_up}</p>
        <hr>
        <h6 class="text-muted">Updates</h6>
        <div id="clerkingAmendments"></div>
      </div></div>`;
    formDiv.style.display = "none";
    renderAmendments("clerkingAmendments", "clerking", note.id);
  } else {
    viewDiv.innerHTML = `<p class="text-muted">No clerking note yet.</p>`;
    formDiv.style.display = "block";
  }
}

// Show the nurse's latest vitals on the clerking tab (read-only) to guide the doctor
async function loadClerkingVitals() {
  const response = await authFetch(`/vitals/${encounterId}`);
  if (!response || !response.ok) return;
  const readings = await response.json();

  const box = document.getElementById("clerkingVitalsSummary");
  if (!Array.isArray(readings) || readings.length === 0) {
    box.innerHTML = `<div class="alert alert-light border mb-3">No vitals recorded yet for this visit.</div>`;
    return;
  }

  const v = readings[readings.length - 1];
  box.innerHTML = `
    <div class="card border-info mb-3">
      <div class="card-body py-2">
        <small class="text-muted d-block mb-1">Latest vitals (recorded by nursing)</small>
        <span class="me-3"><strong>Temp:</strong> ${
          v.temperature ?? "—"
        }°C</span>
        <span class="me-3"><strong>Pulse:</strong> ${v.pulse ?? "—"}</span>
        <span class="me-3"><strong>BP:</strong> ${
          v.blood_pressure ?? "—"
        }</span>
        <span class="me-3"><strong>SpO₂:</strong> ${v.spo2 ?? "—"}%</span>
        <span class="me-3"><strong>RR:</strong> ${
          v.respiratory_rate ?? "—"
        }</span>
      </div>
    </div>`;
}

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
    loadClerking();
  } else {
    alert("Could not save clerking note.");
  }
};

// ---------- VITALS ----------
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
  if (!r) return { label: "", color: "light" };
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

document.getElementById("showVitalsFormBtn").onclick = () => {
  document.getElementById("vitalsForm").style.display = "block";
};
document.getElementById("cancelVitalsBtn").onclick = () => {
  document.getElementById("vitalsForm").style.display = "none";
};

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
    loadVitals();
  } else {
    alert("Could not save vitals.");
  }
};

// ---------- NURSING ----------
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

// ---------- PROGRESS NOTES ----------
async function loadProgress() {
  const response = await authFetch(`/progress/${encounterId}`);
  if (!response) return;
  const notes = await response.json();

  const list = document.getElementById("progressList");
  if (!notes || notes.length === 0) {
    list.innerHTML = `<p class="text-muted">No progress notes yet.</p>`;
    return;
  }

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
        <div id="progressAmendments_${n.id}"></div>
      </div>
    </div>`
    )
    .join("");

  notes.forEach((n) =>
    renderAmendments(`progressAmendments_${n.id}`, "progress", n.id)
  );
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

// ---------- DRUG PICKER ----------
let drugSearchTimer = null;

document.getElementById("m_drug").addEventListener("input", function () {
  const term = this.value.trim();

  // Typing after picking invalidates the selection — otherwise you could
  // choose PANADOL, edit the text, and still send PANADOL's id.
  document.getElementById("m_drug_id").value = "";
  document.getElementById("drugPickHint").textContent = "";

  clearTimeout(drugSearchTimer);
  if (term.length < 2) {
    document.getElementById("drugSearchResults").style.display = "none";
    return;
  }
  drugSearchTimer = setTimeout(() => searchDrugs(term), 300);
});

async function searchDrugs(term) {
  const response = await authFetch(
    `/drug/search?name=${encodeURIComponent(term)}`
  );
  if (!response || !response.ok) return;
  const drugs = await response.json();

  const box = document.getElementById("drugSearchResults");
  if (!Array.isArray(drugs) || drugs.length === 0) {
    box.innerHTML = `<div class="list-group-item text-muted small">
      No match — you can still type the name freely.
    </div>`;
    box.style.display = "block";
    return;
  }

  box.innerHTML = drugs
    .slice(0, 20)
    .map((dr) => {
      const out = dr.quantity === 0;
      const safeName = dr.name.replace(/'/g, "\\'");
      return `<button type="button" class="list-group-item list-group-item-action"
              onclick="selectDrug(${dr.id}, '${safeName}')">
        <strong>${dr.name}</strong>
        ${
          dr.generic
            ? `<br><small class="text-muted">${dr.generic}</small>`
            : ""
        }
        <span class="badge ${out ? "bg-danger" : "bg-success"} float-end">
          ${out ? "Out of stock" : dr.quantity + " in stock"}
        </span>
      </button>`;
    })
    .join("");
  box.style.display = "block";
}

function selectDrug(id, name) {
  document.getElementById("m_drug").value = name;
  document.getElementById("m_drug_id").value = id;
  document.getElementById("drugSearchResults").style.display = "none";
  document.getElementById(
    "drugPickHint"
  ).innerHTML = `<span class="text-success">Linked to pharmacy stock</span>`;
}

document.addEventListener("click", function (e) {
  if (e.target.id !== "m_drug") {
    document.getElementById("drugSearchResults").style.display = "none";
  }
});

// Show the free-text box only when "Other..." is picked
function wireOtherOption(selectId, otherId) {
  document.getElementById(selectId).addEventListener("change", function () {
    const box = document.getElementById(otherId);
    box.style.display = this.value === "__other" ? "block" : "none";
    if (this.value !== "__other") box.value = "";
  });
}
wireOtherOption("m_route", "m_route_other");
wireOtherOption("m_frequency", "m_frequency_other");

// Returns the typed value when "Other" is selected, otherwise the picked one
function pickValue(selectId, otherId) {
  const sel = document.getElementById(selectId).value;
  return sel === "__other"
    ? document.getElementById(otherId).value.trim()
    : sel;
}

// ---------- MEDICATION ----------
async function loadMedication() {
  const response = await authFetch(`/medication/${encounterId}`);
  if (!response) return;
  if (!response.ok) {
    document.getElementById(
      "medicationList"
    ).innerHTML = `<p class="text-muted">Could not load medications.</p>`;
    return;
  }
  const meds = await response.json();
  if (!Array.isArray(meds) || meds.length === 0) {
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
    drug_id: document.getElementById("m_drug_id").value
      ? parseInt(document.getElementById("m_drug_id").value)
      : null,
    drug: document.getElementById("m_drug").value,
    dose: document.getElementById("m_dose").value,
    route: pickValue("m_route", "m_route_other"),
    frequency: pickValue("m_frequency", "m_frequency_other"),
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

// ---------- FLUID BALANCE ----------
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

// ---------- PROCEDURE ----------
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

// ---------- DISCHARGE ----------
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

// ---------- INVESTIGATION ----------
async function loadInvestigation() {
  const response = await authFetch(`/investigation/${encounterId}`);
  if (!response || !response.ok) return;
  const items = await response.json();

  const list = document.getElementById("investigationList");
  if (!Array.isArray(items) || items.length === 0) {
    list.innerHTML = `<p class="text-muted">No investigations requested yet.</p>`;
    return;
  }

  list.innerHTML = items
    .slice()
    .reverse()
    .map((inv) => {
      const done = inv.results;
      return `
    <div class="card shadow-sm border-0 border-start border-4 border-${
      done ? "success" : "warning"
    } mb-2">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <small class="text-muted">Requested: ${new Date(
            inv.created_at
          ).toLocaleString()}</small>
          <span class="badge bg-${done ? "success" : "warning"}">${
        done ? "Result received" : "Pending"
      }</span>
        </div>
        <p class="mb-1"><strong>Clinical Information:</strong> ${
          inv.clinical_information
        }</p>
        <p class="mb-1"><strong>Examination Requested:</strong> ${
          inv.examination_requested
        }</p>
        ${
          done
            ? `
          <p class="mb-1"><strong>Results:</strong> ${inv.results}</p>
          <p class="mb-0 small text-muted">Completed: ${new Date(
            inv.date_completed
          ).toLocaleString()}</p>
        `
            : `
          <div class="mt-2">
            <textarea class="form-control form-control-sm mb-2" id="result_${inv.id}" placeholder="Enter result..."></textarea>
            <button class="btn btn-sm btn-primary" onclick="saveResult(${inv.id})">Save Result</button>
          </div>

          `
        }
        <div id="invAmendments_${inv.id}"></div>
      </div>
    </div>`;
    })
    .join("");

  items.forEach((inv) =>
    renderAmendments(`invAmendments_${inv.id}`, "investigation", inv.id)
  );
}

async function saveResult(id) {
  const results = document.getElementById(`result_${id}`).value;
  if (!results.trim()) {
    alert("Enter the result before saving.");
    return;
  }

  const response = await authFetch(`/investigation/${id}/result`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results: results }),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("You don't have permission to enter results.");
    return;
  }
  if (response.ok) {
    loadInvestigation();
  } else {
    alert("Could not save result.");
  }
}

document.getElementById("showInvFormBtn").onclick = () =>
  (document.getElementById("investigationForm").style.display = "block");
document.getElementById("cancelInvBtn").onclick = () =>
  (document.getElementById("investigationForm").style.display = "none");

document.getElementById("saveInvBtn").onclick = async function () {
  const body = {
    encounter_id: parseInt(encounterId),
    clinical_information: document.getElementById("i_clinical_information")
      .value,
    examination_requested: document.getElementById("i_examination_requested")
      .value,
  };
  const response = await authFetch("/investigation/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("Only doctors can request investigations.");
    return;
  }
  if (response.ok) {
    document.getElementById("investigationForm").style.display = "none";
    ["i_clinical_information", "i_examination_requested"].forEach(
      (id) => (document.getElementById(id).value = "")
    );
    loadInvestigation();
  } else {
    alert("Could not save investigation.");
  }
};

// ---------- AMENDMENTS (shared by clerking, progress, investigation) ----------

// Renders the amendment trail + an "add" box into a given container element.
// containerId  - where to render
// docType      - "clerking" | "progress" | "investigation"
// docId        - id of the note being amended
async function renderAmendments(containerId, docType, docId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const response = await authFetch(`/amendment/${docType}/${docId}`);
  if (!response || !response.ok) return;
  const items = await response.json();

  const trail = (Array.isArray(items) ? items : [])
    .map(
      (a) => `
    <div class="border-start border-3 border-secondary ps-3 mb-2">
      <small class="text-muted d-block">${new Date(
        a.created_at
      ).toLocaleString()}</small>
      <span>${a.content}</span>
    </div>`
    )
    .join("");

  box.innerHTML = `
    ${trail ? `<div class="mt-3">${trail}</div>` : ""}
    <div class="mt-3">
      <textarea class="form-control form-control-sm mb-2"
                id="amend_input_${docType}_${docId}"
                placeholder="Add an update (e.g. lab result, new finding)..."></textarea>
      <button class="btn btn-sm btn-outline-primary"
              onclick="saveAmendment('${containerId}', '${docType}', ${docId})">
        Add Entry
      </button>
    </div>`;
}

async function saveAmendment(containerId, docType, docId) {
  const input = document.getElementById(`amend_input_${docType}_${docId}`);
  const content = input.value.trim();
  if (!content) {
    alert("Write something before adding an entry.");
    return;
  }

  const response = await authFetch("/amendment/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_type: docType,
      document_id: docId,
      content: content,
    }),
  });
  if (!response) return;
  if (response.status === 403) {
    alert("You don't have permission to add entries.");
    return;
  }
  if (response.ok) {
    renderAmendments(containerId, docType, docId); // refresh the trail
  } else {
    alert("Could not add entry.");
  }
}
// ---------- PRESCRIPTION CODE ----------
async function loadPrescriptionCode() {
  const response = await authFetch(`/prescription/encounter/${encounterId}`);
  if (!response || !response.ok) {
    document.getElementById("prescriptionCodeBox").innerHTML = "";
    return;
  }
  const p = await response.json();

  const box = document.getElementById("prescriptionCodeBox");
  if (!p || !p.code) {
    box.innerHTML = "";
    return;
  }

  const expired = new Date(p.expires_at) < new Date();

  box.innerHTML = `
    <div class="card border-success">
      <div class="card-body d-flex justify-content-between align-items-center">
        <div>
          <small class="text-muted d-block">Pharmacy code</small>
          <h3 class="fw-bold mb-0" style="letter-spacing:3px">${p.code}</h3>
          <small class="${expired ? "text-danger" : "text-muted"}">
            ${
              p.is_dispensed
                ? "Already dispensed"
                : expired
                ? "Expired"
                : "Valid until " + new Date(p.expires_at).toLocaleDateString()
            }
          </small>
        </div>
        <button class="btn btn-outline-primary btn-sm" onclick="printSlip('${
          p.code
        }')">
          Print Slip
        </button>
      </div>
    </div>`;
}

// Opens a minimal printable slip — patient ID and code only, no drug names.
function printSlip(code) {
  const w = window.open("", "_blank", "width=400,height=500");
  w.document.write(`
    <html><head><title>Pharmacy Slip</title>
    <style>
      body { font-family: sans-serif; padding: 30px; text-align: center; }
      .code { font-size: 34px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; }
      .label { color: #666; font-size: 12px; text-transform: uppercase; }
      hr { margin: 24px 0; border: none; border-top: 1px dashed #999; }
    </style></head>
    <body>
      <h3>Pharmacy Slip</h3>
      <hr>
      <div class="label">Patient ID</div>
      <div style="font-size:20px; font-weight:bold">${
        window.__patientId || "—"
      }</div>
      <div class="label" style="margin-top:20px">Pharmacy Code</div>
      <div class="code">${code}</div>
      <hr>
      <div style="font-size:11px; color:#666">
        Present this slip at the hospital pharmacy.
      </div>
    </body></html>
  `);
  w.document.close();
  w.print();
}

// ---------- PREV / NEXT VISIT ----------
async function loadAdjacentEncounters() {
  const response = await authFetch(`/encounter/${encounterId}/adjacent`);
  if (!response || !response.ok) return;
  const { previous_id, next_id } = await response.json();

  const prevBtn = document.getElementById("prevEncounterBtn");
  const nextBtn = document.getElementById("nextEncounterBtn");

  // Disabled rather than hidden: the buttons stay in place, so the layout
  // doesn't shift as you move between visits.
  prevBtn.disabled = !previous_id;
  nextBtn.disabled = !next_id;

  if (previous_id)
    prevBtn.onclick = () =>
      (window.location.href = `/encounter-detail/${previous_id}`);
  if (next_id)
    nextBtn.onclick = () =>
      (window.location.href = `/encounter-detail/${next_id}`);

  document.getElementById(
    "summaryBtn"
  ).href = `/encounter-summary/${encounterId}`;
}

loadEncounterInfo();
loadAdjacentEncounters();

// ---------- INITIAL LOAD ----------
showTab("vitals");
