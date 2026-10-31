const BASE = (process.env.REACT_APP_API_URL || "http://localhost:4000").replace(/\/$/, "");

export const getToken = () => localStorage.getItem("token");

// small fetch wrapper: adds the login token, and turns error responses into Error objects
export async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Please check your connection.");
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    // an empty or non-JSON response is handled below
  }
  if (!res.ok) {
    const err = new Error(data.message || "Something went wrong");
    err.status = res.status;
    throw err;
  }
  return data;
}
