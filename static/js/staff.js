async function loadStaff() {
  const response = await authFetch("/auth/users");
  if (!response) return;

  if (response.status === 403) {
    document.getElementById(
      "staffTableBody"
    ).innerHTML = `<tr><td colspan="3" class="text-center text-muted p-4">
         You don't have permission to manage staff.
       </td></tr>`;
    return;
  }
  if (!response.ok) return;

  const users = await response.json();
  const body = document.getElementById("staffTableBody");

  if (!Array.isArray(users) || users.length === 0) {
    body.innerHTML = `<tr><td colspan="3" class="text-center text-muted p-4">No staff accounts yet.</td></tr>`;
    return;
  }

  body.innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>${u.full_name || "—"}</td>
      <td>${u.email}</td>
      <td><span class="badge bg-secondary">${u.role}</span></td>
    </tr>`
    )
    .join("");
}

document.getElementById("showStaffFormBtn").onclick = () => {
  document.getElementById("staffForm").style.display = "block";
};
document.getElementById("cancelStaffBtn").onclick = () => {
  document.getElementById("staffForm").style.display = "none";
};

document.getElementById("saveStaffBtn").onclick = async function () {
  const errorBox = document.getElementById("staffError");
  errorBox.textContent = "";

  const payload = {
    full_name: document.getElementById("s_full_name").value.trim(),
    email: document.getElementById("s_email").value.trim(),
    password: document.getElementById("s_password").value,
    role: document.getElementById("s_role").value,
  };

  if (!payload.full_name || !payload.email || !payload.password) {
    errorBox.textContent = "Fill in every field.";
    return;
  }

  const response = await authFetch("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response) return;

  if (response.status === 403) {
    errorBox.textContent =
      "You don't have permission to create staff accounts.";
    return;
  }

  const data = await response.json();
  if (!response.ok) {
    errorBox.textContent = data.detail || "Could not create the account.";
    return;
  }

  document.getElementById("staffForm").style.display = "none";
  ["s_full_name", "s_email", "s_password"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
  loadStaff();
};

loadStaff();
