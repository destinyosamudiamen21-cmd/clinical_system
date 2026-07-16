// Reads the token and makes an authenticated fetch.
// Use this instead of plain fetch() for any call to a protected route.
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("access_token");

  // if no token, kick them back to login
  if (!token) {
    window.location.href = "/login";
    return;
  }

  // attach the Authorization header
  options.headers = {
    ...(options.headers || {}),
    Authorization: "Bearer " + token,
  };

  const res = await fetch(url, options);

  // if the token is expired/invalid, backend returns 401 → send to login
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    return;
  }

  return res;
}
// Reads the logged-in user's info from the token (without needing the secret)
function getCurrentUser() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    // A JWT is header.payload.signature — the middle part is the readable payload
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    return payload.user; // { email, role, uid }
  } catch (e) {
    return null;
  }
}

function getCurrentRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}
