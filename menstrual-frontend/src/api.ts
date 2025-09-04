import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const instance = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function register(email: string, password: string) {
  const { data } = await instance.post("/auth/register", { email, password });
  return data; // { access_token, token_type? }
}

export async function login(email: string, password: string) {
  const { data } = await instance.post("/auth/login", { email, password });
  await SecureStore.setItemAsync("token", data.access_token);
  return data;
}

export async function addCycle(start_date: string, flow_intensity?: number, notes?: string) {
  const { data } = await instance.post("/cycles/", { start_date, flow_intensity, notes });
  return data;
}

export async function listCycles() {
  const { data } = await instance.get("/cycles/");
  return data;
}

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


export async function addSymptom(date: string, symptom: string, severity?: number, tags?: any, notes?: string) {
  const { data } = await instance.post("/symptoms/", { date, symptom, severity, tags, notes });
  return data;
}

export async function listSymptoms() {
  const { data } = await instance.get("/symptoms/");
  return data;
}

export async function getInsights() {
  const { data } = await instance.get("/insights");
  return data; // { next_period_start?, avg_cycle_length_days?, notes? }
}

export async function chat(prompt: string) {
  const { data } = await instance.post("/chat", { prompt });
  return data;
}
