import React, { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, Alert, FlatList } from "react-native";
import { ask, ingest } from "../api";

export default function Ask() {
  const [question, setQuestion] = useState("What are the cycle phases?");
  const [k, setK] = useState("8");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const onSeed = async () => {
    try {
      await ingest([
        { title: "Cycle Phases", url: "local://phases", text: "Menstrual, Follicular, Ovulatory, Luteal." },
        { title: "Cramps Tips", url: "local://cramps", text: "Heat, hydration, light exercise." },
      ]);
      Alert.alert("Seeded", "Demo docs ingested.");
    } catch (e: any) {
      Alert.alert("Ingest error", JSON.stringify(e?.response?.data || e.message));
    }
  };

  const onAsk = async () => {
    if (!question.trim()) return Alert.alert("Enter a question");
    setLoading(true);
    setAnswer(""); setSources([]);
    try {
      const res = await ask(question, Number(k) || undefined);
      setAnswer(res?.answer ?? JSON.stringify(res, null, 2));
      setSources(Array.isArray(res?.sources) ? res.sources : []);
    } catch (e: any) {
      setAnswer(JSON.stringify(e?.response?.data || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding:16, gap:10, flex:1 }}>
      <Text style={{ fontSize:18, fontWeight:"600" }}>Ask (RAG)</Text>

      <Button title="Seed demo docs" onPress={onSeed} />

      <Text>Question</Text>
      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder="Ask something grounded in your docs…"
        style={{ borderWidth:1, padding:10, borderRadius:10 }}
      />

      <Text>k (retrieved docs)</Text>
      <TextInput
        value={k}
        onChangeText={setK}
        keyboardType="numeric"
        style={{ borderWidth:1, padding:10, borderRadius:10, width:100 }}
      />

      <Button title="Ask" onPress={onAsk} />
      {loading ? <ActivityIndicator /> : null}

      <Text style={{ marginTop:12, fontWeight:"600" }}>Answer</Text>
      <Text selectable>{answer}</Text>

      {sources.length > 0 && (
        <>
          <Text style={{ marginTop:12, fontWeight:"600" }}>Sources</Text>
          <FlatList
            data={sources}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Text selectable>• {item.title} — {item.url}</Text>
            )}
          />
        </>
      )}
    </View>
  );
}
