// static/js/encounter_summary.js
// Assembles all nine clinical documents for one encounter into a single
// read-only sheet, laid out for reading and printing.

const encounterId = window.location.pathname.split("/").pop();

// ---------- helpers ----------

const esc = (v) =>
  v == null || v === ""
    ? ""
    : String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

const dt = (v) => (v ? new Date(v).toLocaleString() : "—");
const d = (v) => (v ? new Date(v).toLocaleDateString() : "—");

// One labelled field. Skipped entirely when empty, so the printed sheet
// doesn't carry rows of dashes.
function field(label, value) {
  if (value == null || value === "") return "";
  return `<div class="field">
    <span class="field-label">${label}:</span>
    <span class="field-value">${esc(value)}</span>
  </div>`;
}

function block(title, inner) {
  return `<div class="doc-block">
    <h6>${title}</h6>
    ${inner || `<p class="empty">Not recorded for this visit.</p>`}
  </div>`;
}

// Fetch that returns null instead of throwing, so one missing document
// can't blank the whole summary.
async function safeGet(url) {
  try {
    const res = await authFetch(url);
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// Amendment trail for a document, rendered read-only (no add box here —
// this page is for reading and printing, not editing).
function amendmentTrail(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items
    .map(
      (a) => `<div class="amend">
        <small class="text-muted d-block">${dt(a.created_at)}</small>
        ${esc(a.content)}
      </div>`
    )
    .join("");
}

// ---------- main ----------

async function loadSummary() {
  const encounter = await safeGet(`/encounter/${encounterId}`);
  if (!encounter) {
    document.getElementById(
      "sheet"
    ).innerHTML = `<p class="text-danger">Could not load this encounter.</p>`;
    return;
  }

  // Everything else in parallel — nine documents plus the patient. Sequential
  // awaits would make this page visibly slow for no reason; none of these
  // depend on each other.
  const [
    patient,
    vitals,
    clerking,
    investigations,
    medications,
    nursing,
    progress,
    procedures,
    fluids,
    discharge,
  ] = await Promise.all([
    safeGet(`/patient/${encounter.patient_id}`),
    safeGet(`/vitals/${encounterId}`),
    safeGet(`/clerking/${encounterId}`),
    safeGet(`/investigation/${encounterId}`),
    safeGet(`/medication/${encounterId}`),
    safeGet(`/nursing/${encounterId}`),
    safeGet(`/progress/${encounterId}`),
    safeGet(`/procedure/${encounterId}`),
    safeGet(`/fluid/${encounterId}`),
    safeGet(`/discharge/${encounterId}`),
  ]);

  // Amendment trails for the document types that carry them
  const [clerkingAmends, progressAmends, investigationAmends] =
    await Promise.all([
      clerking && clerking.id
        ? safeGet(`/amendment/clerking/${clerking.id}`)
        : null,
      Array.isArray(progress) && progress.length
        ? Promise.all(
            progress.map((n) => safeGet(`/amendment/progress/${n.id}`))
          )
        : null,
      Array.isArray(investigations) && investigations.length
        ? Promise.all(
            investigations.map((i) =>
              safeGet(`/amendment/investigation/${i.id}`)
            )
          )
        : null,
    ]);

  const parts = [];

  // ----- header -----
  parts.push(`
    <div class="d-flex justify-content-between align-items-start mb-4 pb-3"
         style="border-bottom:3px solid #1a3c6e">
      <div>
        <h4 class="fw-bold mb-1">Demo Clinic</h4>
        <small class="text-muted">Clinical Encounter Summary</small>
      </div>
      <div class="text-end">
        <small class="text-muted d-block">Printed</small>
        <span>${new Date().toLocaleString()}</span>
      </div>
    </div>`);

  // ----- patient + visit -----
  parts.push(`
    <div class="row mb-4">
      <div class="col-6">
        ${field(
          "Patient",
          patient ? patient.full_name : `#${encounter.patient_id}`
        )}
        ${patient ? field("Hospital No.", patient.id) : ""}
        ${patient ? field("Age", patient.age) : ""}
        ${patient ? field("Sex", patient.gender) : ""}
      </div>
      <div class="col-6">
        ${field("Visit date", d(encounter.encounter_date))}
        ${field("Ward / Clinic", encounter.ward_clinic)}
        ${field("Status", encounter.workflow_status || encounter.status)}
      </div>
    </div>`);

  // ----- 1. vitals -----
  let vitalsHtml = "";
  if (Array.isArray(vitals) && vitals.length) {
    vitalsHtml = `
      <table class="table table-sm">
        <thead><tr>
          <th>Time</th><th>Temp</th><th>Pulse</th><th>RR</th>
          <th>BP</th><th>SpO2</th><th>Weight</th><th>Pain</th>
        </tr></thead>
        <tbody>
          ${vitals
            .map(
              (v) => `<tr>
              <td>${dt(v.created_at)}</td>
              <td>${esc(v.temperature) || "—"}</td>
              <td>${esc(v.pulse) || "—"}</td>
              <td>${esc(v.respiratory_rate) || "—"}</td>
              <td>${esc(v.blood_pressure) || "—"}</td>
              <td>${esc(v.spo2) || "—"}</td>
              <td>${esc(v.weight) || "—"}</td>
              <td>${esc(v.pain_score) || "—"}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }
  parts.push(block("1. Vital Signs", vitalsHtml));

  // ----- 2. clerking -----
  let clerkingHtml = "";
  if (clerking && clerking.id) {
    clerkingHtml =
      field("Date", dt(clerking.created_at)) +
      field("Presenting Complaints", clerking.presenting_complaints) +
      field("History", clerking.history) +
      field("Examination", clerking.examination) +
      field("Assessment", clerking.assessment) +
      field("Diagnosis", clerking.diagnosis) +
      field("Investigations", clerking.investigations) +
      field("Treatment Plan", clerking.treatment_plan) +
      field("Follow-up", clerking.follow_up) +
      amendmentTrail(clerkingAmends);
  }
  parts.push(block("2. Doctor's Clerking", clerkingHtml));

  // ----- 3. investigations -----
  let invHtml = "";
  if (Array.isArray(investigations) && investigations.length) {
    invHtml = investigations
      .map(
        (inv, idx) => `<div class="mb-3">
          ${field("Requested", dt(inv.created_at))}
          ${field("Clinical Information", inv.clinical_information)}
          ${field("Examination Requested", inv.examination_requested)}
          ${field("Results", inv.results || "Pending")}
          ${
            inv.date_completed ? field("Completed", dt(inv.date_completed)) : ""
          }
          ${amendmentTrail(
            investigationAmends ? investigationAmends[idx] : null
          )}
        </div>`
      )
      .join("");
  }
  parts.push(block("3. Investigations", invHtml));

  // ----- 4. medication -----
  let medHtml = "";
  if (Array.isArray(medications) && medications.length) {
    medHtml = `
      <table class="table table-sm">
        <thead><tr>
          <th>Drug</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Start</th><th>Stop</th>
        </tr></thead>
        <tbody>
          ${medications
            .map(
              (m) => `<tr>
              <td><strong>${esc(m.drug)}</strong></td>
              <td>${esc(m.dose)}</td>
              <td>${esc(m.route)}</td>
              <td>${esc(m.frequency)}</td>
              <td>${d(m.start_date)}</td>
              <td>${d(m.stop_date)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }
  parts.push(block("4. Medication Chart", medHtml));

  // ----- 5. nursing -----
  let nursingHtml = "";
  if (nursing && nursing.id) {
    nursingHtml =
      field("Chief Complaint", nursing.chief_complaint) +
      field("Nursing Assessment", nursing.nursing_assessment) +
      field("Nursing Diagnosis", nursing.nursing_diagnosis) +
      field("Care Plan", nursing.care_plan) +
      field("Evaluation", nursing.evaluation);
  }
  parts.push(block("5. Nursing Assessment", nursingHtml));

  // ----- 6. progress notes -----
  let progressHtml = "";
  if (Array.isArray(progress) && progress.length) {
    progressHtml = progress
      .map(
        (n, idx) => `<div class="mb-3">
          <small class="text-muted">${dt(n.created_at)}</small>
          ${field("S", n.subjective)}
          ${field("O", n.objective)}
          ${field("A", n.assessment)}
          ${field("P", n.plan)}
          ${amendmentTrail(progressAmends ? progressAmends[idx] : null)}
        </div>`
      )
      .join("");
  }
  parts.push(block("6. Progress Notes (SOAP)", progressHtml));

  // ----- 7. procedures -----
  let procHtml = "";
  if (Array.isArray(procedures) && procedures.length) {
    procHtml = procedures
      .map(
        (p) => `<div class="mb-3">
          <small class="text-muted">${dt(p.created_at)}</small>
          ${field("Indication", p.indication)}
          ${field("Procedure", p.procedure)}
          ${field("Findings", p.findings)}
          ${field("Complications", p.complications || "None")}
          ${field("Plan", p.plan)}
        </div>`
      )
      .join("");
  }
  parts.push(block("7. Procedure Notes", procHtml));

  // ----- 8. fluid balance -----
  let fluidHtml = "";
  if (Array.isArray(fluids) && fluids.length) {
    let totalIn = 0,
      totalOut = 0;
    fluids.forEach((f) => {
      totalIn += f.intake || 0;
      totalOut += f.output || 0;
    });
    fluidHtml = `
      <table class="table table-sm">
        <thead><tr><th>Time</th><th>Intake (ml)</th><th>Output (ml)</th><th>Balance</th></tr></thead>
        <tbody>
          ${fluids
            .map(
              (f) => `<tr>
              <td>${dt(f.time)}</td>
              <td>${esc(f.intake) || "—"}</td>
              <td>${esc(f.output) || "—"}</td>
              <td>${esc(f.balance) || "—"}</td>
            </tr>`
            )
            .join("")}
          <tr class="fw-bold">
            <td>Total</td><td>${totalIn}</td><td>${totalOut}</td>
            <td>${totalIn - totalOut}</td>
          </tr>
        </tbody>
      </table>`;
  }
  parts.push(block("8. Fluid Balance", fluidHtml));

  // ----- 9. discharge -----
  let dischargeHtml = "";
  if (discharge && discharge.id) {
    dischargeHtml =
      field("Diagnosis", discharge.diagnosis) +
      field("Hospital Course", discharge.hospital_course) +
      field("Discharge Medications", discharge.discharge_medications) +
      field("Follow-up", discharge.follow_up);
  }
  parts.push(block("9. Discharge Summary", dischargeHtml));

  document.getElementById("sheet").innerHTML = parts.join("");
}

loadSummary();
