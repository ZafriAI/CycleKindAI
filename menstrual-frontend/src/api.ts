import axios from "axios";
import Constants from "expo-constants";
import { getString, saveString } from "./storage";

const BASE = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:8000";

async function authHeaders() {
  const t = await getString("token"); // same key used in useAuth.tsx
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

const instance = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use(async (config) => {
  const token = await getString("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


export async function ingest(docs: Array<{title:string; url:string; text:string}>) {
  const { data } = await instance.post("/ingest", { docs });
  return data; // e.g. { ingested: 2 }
}

export async function ask(question: string, k?: number) {
  const payload: any = { question };
  if (typeof k === "number") payload.k = k; // optional per your spec
  const { data } = await instance.post("/ask", payload);
  return data; // { answer, sources?, disclaimer? }
}


export async function chat(prompt: string) {
  const { data } = await instance.post("/chat", { prompt });
  return data;
}

export type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export async function chatWithHistory(messages: ChatMsg[], threadId?: string) {
  const { data } = await instance.post("/chat", { messages, threadId });
  return data as { answer: string; threadId?: string };
}


// ------------- CYCLES -------------
export async function listCycles() {
  const r = await fetch(`${BASE}/cycles/`, { headers: await authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function addCycle(body: {
  start_date: string; end_date?: string | null; flow_intensity?: number | null; notes?: string | null;
}) {
  const r = await fetch(`${BASE}/cycles/`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function updateCycle(id: number, body: Partial<{
  start_date: string; end_date: string | null; flow_intensity: number | null; notes: string | null;
}>) {
  const r = await fetch(`${BASE}/cycles/${id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function deleteCycle(id: number) {
  const r = await fetch(`${BASE}/cycles/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ------------- SYMPTOMS -------------
export async function listSymptoms() {
  const r = await fetch(`${BASE}/symptoms/`, { headers: await authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function addSymptom(body: {
  date: string; symptom: string; severity?: number | null; tags?: Record<string, any> | null; notes?: string | null;
}) {
  const r = await fetch(`${BASE}/symptoms/`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function updateSymptom(id: number, body: Partial<{
  date: string; symptom: string; severity: number | null; tags: Record<string, any> | null; notes: string | null;
}>) {
  const r = await fetch(`${BASE}/symptoms/${id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function deleteSymptom(id: number) {
  const r = await fetch(`${BASE}/symptoms/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ------------- INSIGHTS -------------
export async function getInsights() {
  const r = await fetch(`${BASE}/insights`, { headers: await authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ------------- AUTH (ensure these return access_token) -------------
export async function login(email: string, password: string) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.detail || data?.message || "Login failed");
  return data; // must include { access_token, ... }
}

export async function register(email: string, password: string) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.detail || data?.message || "Register failed");
  return data; // must include { access_token, ... }
}