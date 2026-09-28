const KEY = "sf_auth";

export const getAuth = () => {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
};
export const setAuth = (value) => localStorage.setItem(KEY, JSON.stringify(value));
export const clearAuth = () => localStorage.removeItem(KEY);

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const auth = getAuth();
  if (auth?.token) headers.Authorization = `Token ${auth.token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running on port 8000?");
  }
  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* response was not JSON */ }

  if (!res.ok) {
    if (res.status === 429) throw new Error("Too many requests. Please wait a while and try again.");
    if (res.status === 401 && auth) {          // token expired / logged out elsewhere
      clearAuth();
      window.dispatchEvent(new Event("sf-logout"));
    }
    throw new Error(data?.error || data?.detail || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  upload: (path, form) => request(path, { method: "POST", form }),
  del: (path) => request(path, { method: "DELETE" }),
};
