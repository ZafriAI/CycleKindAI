import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, TextInput, Button, View, Alert } from "react-native";
import Constants from "expo-constants";
import { register, login, addCycle, listCycles, addSymptom, listSymptoms, getInsights, chat } from "../src/api";

export default function Home() {
  const base = Constants.expoConfig?.extra?.apiBaseUrl || "(missing)";
  const [status, setStatus] = useState("checking...");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("Passw0rd!");
  const [cycles, setCycles] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [prompt, setPrompt] = useState("Give me a gentle self-care tip for PMS");
  const [chatAns, setChatAns] = useState("");

  const ping = async () => {
    try { const r = await fetch(`${base}/health`); setStatus(`OK ${await r.text()}`); }
    catch (e: any) { setStatus(`FAIL ${e?.message}`); }
  };

  const load = async () => {
    try {
      const [c, s, i] = await Promise.all([listCycles(), listSymptoms(), getInsights()]);
      setCycles(c); setSymptoms(s); setInsights(i);
    } catch (e: any) {
      console.log("LOAD ERROR", e?.response?.data || e.message);
    }
  };

  useEffect(() => { ping().then(load); }, []);

  return (
    <SafeAreaView style={{ flex:1, padding:16 }}>
      <ScrollView>
        <Text style={{ fontSize:22, fontWeight:"600" }}>Menstrual App (Dev)</Text>
        <Text selectable>apiBaseUrl: {base}</Text>
        <Text selectable>Status: {status}</Text>

        <Text style={{ marginTop:12 }}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none"
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />

        <Text style={{ marginTop:12 }}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />

        <View style={{ flexDirection:"row", gap:8, marginTop:12 }}>
          <Button title="Register" onPress={async () => { await register(email, password); Alert.alert("Registered"); }} />
          <Button title="Login" onPress={async () => { await login(email, password); Alert.alert("Logged in"); await load(); }} />
        </View>

        <View style={{ height:12 }} />
        <Button title="Add Period (today)" onPress={async () => {
          const today = new Date().toISOString().slice(0,10);
          await addCycle(today, 3, "app demo");
          await load();
        }} />

        <View style={{ height:8 }} />
        <Button title="Add Symptom (tomorrow: cramps 2)" onPress={async () => {
          const d = new Date(Date.now()+24*3600*1000).toISOString().slice(0,10);
          await addSymptom(d, "cramps", 2, { mood:"low" }, "demo");
          await load();
        }} />

        <Text style={{ marginTop:16, fontSize:18, fontWeight:"600" }}>Insights</Text>
        <Text selectable>{JSON.stringify(insights, null, 2)}</Text>

        <Text style={{ marginTop:16, fontSize:18, fontWeight:"600" }}>Cycles</Text>
        <Text selectable>{JSON.stringify(cycles, null, 2)}</Text>

        <Text style={{ marginTop:16, fontSize:18, fontWeight:"600" }}>Symptoms</Text>
        <Text selectable>{JSON.stringify(symptoms, null, 2)}</Text>

        <Text style={{ marginTop:16 }}>Chat prompt</Text>
        <TextInput value={prompt} onChangeText={setPrompt}
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />
        <Button title="Ask" onPress={async () => {
          const res = await chat(prompt);
          setChatAns(res?.answer || JSON.stringify(res));
        }} />
        <Text style={{ marginTop:8 }} selectable>{chatAns}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
