async function loadQueue() {
  const response = await authFetch("/encounter/queue");
  if (!response) return;

  if (response.status === 403) {
    document.getElementById(
      "queueList"
    ).innerHTML = `<div class="text-muted p-3">Only doctors can view the queue.</div>`;
    return;
  }
  if (!response.ok) {
    document.getElementById(
      "queueList"
    ).innerHTML = `<div class="text-muted p-3">Could not load the queue.</div>`;
    return;
  }

  const encounters = await response.json();
  const list = document.getElementById("queueList");
  list.innerHTML = "";

  if (!Array.isArray(encounters) || encounters.length === 0) {
    list.innerHTML = `<div class="text-muted p-3">No patients waiting.</div>`;
    return;
  }

  encounters.forEach((enc) => {
    const item = document.createElement("a");
    item.href = `/encounter-detail/${enc.id}`;
    item.className =
      "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
    item.innerHTML = `
      <div>
        <strong>${enc.patient_name}</strong>
        <span class="text-muted ms-2">${enc.ward_clinic || ""}</span>
        <span class="text-muted ms-2">${new Date(
          enc.encounter_date
        ).toLocaleString()}</span>
      </div>
      <span class="badge bg-warning">Awaiting doctor</span>
      <span class="text-muted ms-2">${enc.ward_clinic || ""}</span>
    `;
    list.appendChild(item);
  });
}

document.getElementById("refreshBtn").onclick = loadQueue;

loadQueue();
