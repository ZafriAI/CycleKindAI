// src/chat/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const CHAT_STORAGE_KEY = "chat_history_v1";

export type Message = { role: "user" | "assistant" | "system"; content: string };

export async function loadChat(): Promise<Message[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveChat(messages: Message[]) {
  try {
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore write errors
  }
}

export async function clearChat() {
  try {
    await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
