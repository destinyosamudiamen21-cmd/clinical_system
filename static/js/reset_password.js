// pull the token out of the URL: /reset-password?token=abc123
const token = new URLSearchParams(window.location.search).get("token");

function showMsg(text, type) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = "alert alert-" + type;
}

if (!token) showMsg("Invalid reset link.", "danger");

document.getElementById("resetBtn").onclick = async function () {
  const pw = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (!pw || pw.length < 6) {
    showMsg("Password must be at least 6 characters.", "danger");
    return;
  }
  if (pw !== confirm) {
    showMsg("Passwords do not match.", "danger");
    return;
  }

  const res = await fetch("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, new_password: pw }),
  });

  const data = await res.json();
  if (res.ok) {
    showMsg("Password reset. Redirecting to login...", "success");
    setTimeout(() => (window.location.href = "/login"), 2000);
  } else {
    showMsg(data.detail || "Could not reset password.", "danger");
  }
};
