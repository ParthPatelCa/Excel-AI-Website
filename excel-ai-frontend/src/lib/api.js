// src/lib/api.js
const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  get: (p) => request(p),
  post: (p, body) =>
    request(p, { method: "POST", body: JSON.stringify(body) }),
};
