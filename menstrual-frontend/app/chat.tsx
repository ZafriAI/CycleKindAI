import React, { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator } from "react-native";
import { chat } from "../src/api";

export default function Chat() {
  const [prompt, setPrompt] = useState("Give me a gentle self-care tip for PMS");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setAnswer("");
    try {
      const res = await chat(prompt);
      setAnswer(res?.answer ?? JSON.stringify(res, null, 2));
    } catch (e: any) {
      setAnswer(JSON.stringify(e?.response?.data || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding:16, gap:10 }}>
      <Text style={{ fontSize:18, fontWeight:"600" }}>Chat</Text>
      <TextInput value={prompt} onChangeText={setPrompt} style={{ borderWidth:1, padding:10, borderRadius:10 }} />
      <Button title="Send" onPress={onSend} />
      {loading ? <ActivityIndicator /> : null}
      <Text style={{ marginTop:10 }} selectable>{answer}</Text>
    </View>
  );
}
