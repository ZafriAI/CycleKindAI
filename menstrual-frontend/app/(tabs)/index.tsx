import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View, Alert } from "react-native";
import Card from "../../src/ui/components/Card";
import Button from "../../src/ui/components/Button";
import Input from "../../src/ui/components/Input";
import { Colors, Fonts, Space } from "../../src/ui/tokens";
import Constants from "expo-constants";
import { addCycle, listCycles, addSymptom, listSymptoms, getInsights} from "../../src/api";

export default function Home() {
  const base = Constants.expoConfig?.extra?.apiBaseUrl || "(missing)";
  // const [status, setStatus] = useState("checking...");
  // const [email, setEmail] = useState("demo@example.com");
  // const [password, setPassword] = useState("Passw0rd!");
  const [cycles, setCycles] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  // const [prompt, setPrompt] = useState("Give me a gentle self-care tip for PMS");
  // const [chatAns, setChatAns] = useState("");

  // const ping = async () => {
  //   try { const r = await fetch(`${base}/health`); setStatus(`OK ${await r.text()}`); }
  //   catch (e: any) { setStatus(`FAIL ${e?.message}`); }
  // };

  const load = async () => {
    try {
      const [c, s, i] = await Promise.all([listCycles(), listSymptoms(), getInsights()]);
      setCycles(c); setSymptoms(s); setInsights(i);
    } catch (e: any) {
      console.log("LOAD ERROR", e?.response?.data || e.message);
    }
  };
  

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: Space.md }}>
        <Text style={{ fontSize: Fonts.title, fontWeight:"700", marginBottom: Space.sm }}>Home</Text>
        {/* <Card style={{ marginBottom: Space.md }}>
          <Text selectable>apiBaseUrl: {base}</Text>
        </Card> */}

        {/* <Text style={{ marginTop:12 }}>Email</Text>
        <Input value={email} onChangeText={setEmail} autoCapitalize="none"
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />

        <Text style={{ marginTop:12 }}>Password</Text>
        <Input value={password} onChangeText={setPassword} secureTextEntry
          style={{ borderWidth:1, padding:8, borderRadius:8 }} /> */}

        

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

        <Card style={{ marginBottom: Space.md }}>
          <Text style={{ fontSize: 18, fontWeight:"600", marginBottom: 6 }}>Insights</Text>
          <Text selectable>{JSON.stringify(insights, null, 2)}</Text>
        </Card>

        <Card style={{ marginBottom: Space.md }}>
          <Text style={{ fontSize: 18, fontWeight:"600", marginBottom: 6 }}>Cycles</Text>
          <Text selectable>{JSON.stringify(cycles, null, 2)}</Text>
        </Card>

        <Card style={{ marginBottom: Space.md }}>
          <Text style={{ fontSize: 18, fontWeight:"600", marginBottom: 6 }}>Symptoms</Text>
          <Text selectable>{JSON.stringify(symptoms, null, 2)}</Text>
        </Card>

        {/* <Text style={{ marginTop:8 }} selectable>{chatAns}</Text> */}
      </ScrollView>
    </SafeAreaView>
  );
}
