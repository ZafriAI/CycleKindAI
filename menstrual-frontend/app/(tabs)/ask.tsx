import React, { useState } from "react";
import {Text, Alert, FlatList, SafeAreaView, ScrollView, View} from "react-native";
import Card from "../../src/ui/components/Card";
import Button from "../../src/ui/components/Button";
import Input from "../../src/ui/components/Input";
import { Colors, Fonts, Space } from "../../src/ui/tokens";
import { ask, ingest } from "../../src/api";


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
        { title: "Cramps Tips",  url: "local://cramps", text: "Heat, hydration, light exercise." }
      ]);
      Alert.alert("Seeded", "Demo docs ingested.");
    } catch (e: any) {
      Alert.alert("Ingest error", JSON.stringify(e?.response?.data || e.message));
    }
  };

  const onAsk = async () => {
    if (!question.trim()) return Alert.alert("Enter a question");
    setLoading(true); setAnswer(""); setSources([]);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: Space.md }}>
        <Text style={{ fontSize: Fonts.title, fontWeight:"700", marginBottom: Space.sm }}>Ask</Text>
 
        <Card style={{ marginBottom: Space.md }}>
          <Button title="Seed demo docs" onPress={onSeed} variant="secondary" />
          <Text style={{ marginTop: Space.sm, fontSize: 13, color: Colors.textMuted }}>Question</Text>
          <Input value={question} onChangeText={setQuestion} multiline style={{ minHeight: 64, marginTop: 6 }} />
          <Text style={{ marginTop: Space.sm, fontSize: 13, color: Colors.textMuted }}>Top-K</Text>
          <Input value={k} onChangeText={setK} keyboardType="numeric" style={{ width: 90, marginTop: 6 }} />
          <Button title="Ask" onPress={onAsk} loading={loading} style={{ marginTop: Space.sm }} />
        </Card>
 
        {!!answer && (
          <Card style={{ marginBottom: Space.md }}>
            <Text style={{ fontSize: 18, fontWeight:"600", marginBottom: 8 }}>Answer</Text>
            <Text selectable>{answer}</Text>
          </Card>
        )}
 
        {sources.length > 0 && (
          <Card>
            <View style={{ gap: 8 }}>
              {sources.map((item, i) => (
                <Text key={i} selectable>• {item.title} — {item.url}</Text>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
