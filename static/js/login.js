// ===== CONFIG - make sure these match YOUR backend =====
const LOGIN_URL = "/auth/login";
const SIGNUP_URL = "/auth/signup";
const AFTER_LOGIN_REDIRECT = "/"; // change to your real dashboard route

let mode = "login"; // "login" or "signup"

const els = {
  title: document.getElementById("formTitle"),
  subtitle: document.getElementById("formSubtitle"),
  fullNameField: document.getElementById("fullNameField"),
  roleField: document.getElementById("roleField"),
  submitBtn: document.getElementById("submitBtn"),
  switchLine: document.getElementById("switchLine"),
  switchLink: document.getElementById("switchLink"),
  msg: document.getElementById("msg"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  fullName: document.getElementById("fullName"),
  role: document.getElementById("role"),
  terms: document.getElementById("terms"),
};

function showMsg(text, type) {
  els.msg.textContent = text;
  els.msg.className = "msg " + type;
}
function clearMsg() {
  els.msg.className = "msg";
  els.msg.textContent = "";
}

function setMode(newMode) {
  mode = newMode;
  clearMsg();
  if (mode === "signup") {
    els.title.textContent = "Create your account";
    els.subtitle.textContent = "Set up a new staff account.";
    els.fullNameField.style.display = "block";
    els.roleField.style.display = "block";
    els.submitBtn.textContent = "Sign Up";
    els.switchLine.innerHTML =
      'Already have an account? <a id="switchLink">Log in</a>';
  } else {
    els.title.textContent = "Welcome back";
    els.subtitle.textContent = "Log in to your staff account to continue.";
    els.fullNameField.style.display = "none";
    els.roleField.style.display = "none";
    els.submitBtn.textContent = "Log In";
    els.switchLine.innerHTML =
      'Don\'t have an account? <a id="switchLink">Sign up</a>';
  }
  // rebind the recreated link
  document.getElementById("switchLink").onclick = () =>
    setMode(mode === "login" ? "signup" : "login");
}

els.switchLink.onclick = () => setMode("signup");

async function handleSubmit() {
  clearMsg();
  const email = els.email.value.trim();
  const password = els.password.value;

  if (!email || !password) {
    showMsg("Please fill in email and password.", "error");
    return;
  }
  if (!els.terms.checked) {
    showMsg("Please accept the Terms & Conditions.", "error");
    return;
  }

  els.submitBtn.disabled = true;

  try {
    if (mode === "signup") {
      // ---- SIGN UP ----
      const res = await fetch(SIGNUP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          full_name: els.fullName.value.trim(),
          role: els.role.value,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Sign up failed.");
      }
      showMsg("Account created! You can now log in.", "success");
      setMode("login");
    } else {
      // ---- LOG IN ----
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Invalid email or password.");
      }
      const data = await res.json();
      // ===== STORE THE TOKEN in the browser =====
      localStorage.setItem("access_token", data.access_token);
      // go to the dashboard
      window.location.href = AFTER_LOGIN_REDIRECT;
    }
  } catch (e) {
    showMsg(e.message, "error");
  } finally {
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = mode === "login" ? "Log In" : "Sign Up";
  }
}

els.submitBtn.onclick = handleSubmit;
els.password.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSubmit();
});
els.email.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSubmit();
});
