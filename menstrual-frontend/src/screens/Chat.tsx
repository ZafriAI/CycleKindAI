import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, Button, ActivityIndicator, Alert } from "react-native";
import Constants from "expo-constants";
import { chat } from "../api";

export default function App() {
  const [prompt, setPrompt] = useState("Give me a gentle self-care tip for PMS");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    const base = Constants.expoConfig?.extra?.apiBaseUrl;
    if (!base) {
      Alert.alert("API not set", "Set extra.apiBaseUrl in app.config.js");
      return;
    }
    if (!prompt.trim()) {
      Alert.alert("Empty prompt", "Type something to send");
      return;
    }
    setLoading(true);
    try {
      const res = await chat(prompt); // calls POST /chat { prompt }
      setAnswer(res?.answer ?? JSON.stringify(res, null, 2));
    } catch (e: any) {
      setAnswer(JSON.stringify(e?.response?.data || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex:1, padding:16 }}>
      <View style={{ flex:1 }}>
        <Text style={{ fontSize:22, fontWeight:"600" }}>Menstrual App — Chat</Text>
        <Text style={{ marginTop:8, opacity:0.7 }}>
          API: {String(Constants.expoConfig?.extra?.apiBaseUrl || "not set")}
        </Text>

        <Text style={{ marginTop:16 }}>Prompt</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Type your prompt…"
          style={{ borderWidth:1, padding:10, borderRadius:10, minHeight:44 }}
        />

        <View style={{ height:10 }} />
        <Button title="Send" onPress={onSend} />

        <View style={{ marginTop:16 }}>
          {loading ? <ActivityIndicator /> : null}
          <Text style={{ fontSize:16, fontWeight:"600", marginBottom:6 }}>Answer</Text>
          <Text selectable>{answer}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
