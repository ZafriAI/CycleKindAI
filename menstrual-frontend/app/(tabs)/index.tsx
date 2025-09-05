import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView, ScrollView, Text, View, Pressable } from "react-native";
import Card from "../../src/ui/components/Card";
import {
  listCycles, listSymptoms, getInsights,
  addCycle, updateCycle, deleteCycle,
  addSymptom, updateSymptom, deleteSymptom
} from "../../src/api";
import CycleCalendar from "../../components/CycleCalendar";
import CycleFormModal from "../../components/modals/CycleFormModal";
import SymptomFormModal from "../../components/modals/SymptomFormModal";
import { useAuth } from "../../src/auth/useAuth";

export default function Home() {
  const { token, loading } = useAuth();

  // Declare hooks unconditionally at the top
  const [cycles, setCycles] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [insights, setInsights] = useState<any | null>(null);

  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<any | undefined>();
  const [editingSymptom, setEditingSymptom] = useState<any | undefined>();

  const reload = useCallback(async () => {
    const [c, s, i] = await Promise.all([listCycles(), listSymptoms(), getInsights()]);
    setCycles(c); setSymptoms(s); setInsights(i);
  }, []);

  // Only run when auth is ready and we have a token
  useEffect(() => {
    if (!loading && token) {
      reload().catch(console.error);
    }
  }, [loading, token, reload]);

  if (loading) return null; // or a splash component

  // Open modals (prefilled)
  const requestAddCycle = (startISO: string) => {
    setEditingCycle({ start_date: startISO, end_date: null, flow_intensity: null, notes: "" });
    setCycleModalOpen(true);
  };
  const requestAddSymptom = (dateISO: string) => {
    setEditingSymptom({ date: dateISO, symptom: "", severity: null, tags: null, notes: "" });
    setSymptomModalOpen(true);
  };

  // Saves
  const saveCycle = async (body: any) => {
    if (body.id) {
      await updateCycle(body.id, {
        start_date: body.start_date,
        end_date: body.end_date ?? null,
        flow_intensity: body.flow_intensity ?? null,
        notes: body.notes ?? null,
      });
    } else {
      await addCycle({
        start_date: body.start_date,
        end_date: body.end_date ?? null,
        flow_intensity: body.flow_intensity ?? null,
        notes: body.notes ?? null,
      });
    }
    setCycleModalOpen(false);
    await reload();
  };

  const saveSymptom = async (body: any) => {
    if (body.id) {
      await updateSymptom(body.id, {
        date: body.date,
        symptom: body.symptom,
        severity: body.severity ?? null,
        tags: body.tags ?? null,
        notes: body.notes ?? null,
      });
    } else {
      await addSymptom({
        date: body.date,
        symptom: body.symptom,
        severity: body.severity ?? null,
        tags: body.tags ?? null,
        notes: body.notes ?? null,
      });
    }
    setSymptomModalOpen(false);
    await reload();
  };

  // Deletes
  const removeCycle = async (id: number) => {
    await deleteCycle(id);
    setCycleModalOpen(false);
    await reload();
  };
  const removeSymptom = async (id: number) => {
    await deleteSymptom(id);
    setSymptomModalOpen(false);
    await reload();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>Home</Text>

        <CycleCalendar
          cycles={cycles}
          symptoms={symptoms}
          onRequestAddCycle={requestAddCycle}
          onRequestAddSymptom={requestAddSymptom}
        />

        {/* Cycles Card */}
        <Card>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Cycles</Text>
          <View style={{ gap: 8 }}>
            {cycles.map((c) => (
              <Pressable key={c.id} onPress={() => { setEditingCycle(c); setCycleModalOpen(true); }}>
                <View style={{ padding: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10 }}>
                  <Text>
                    {c.start_date} → {c.end_date ?? "(open)"}  • flow:{c.flow_intensity ?? "-"}
                  </Text>
                  {!!c.notes && <Text style={{ color: "#6b7280" }}>{c.notes}</Text>}
                </View>
              </Pressable>
            ))}
            {cycles.length === 0 && <Text style={{ color: "#6b7280" }}>No cycles yet.</Text>}
          </View>
        </Card>

        {/* Symptoms Card */}
        <Card>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Symptoms</Text>
          <View style={{ gap: 8 }}>
            {symptoms.map((s) => (
              <Pressable key={s.id} onPress={() => { setEditingSymptom(s); setSymptomModalOpen(true); }}>
                <View style={{ padding: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10 }}>
                  <Text>{s.date} • {s.symptom}{s.severity ? `:${s.severity}` : ""}</Text>
                  {!!s.notes && <Text style={{ color: "#6b7280" }}>{s.notes}</Text>}
                </View>
              </Pressable>
            ))}
            {symptoms.length === 0 && <Text style={{ color: "#6b7280" }}>No symptoms yet.</Text>}
          </View>
        </Card>

        {/* Insights */}
        <Card>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Insights</Text>
          <Text selectable>{JSON.stringify(insights, null, 2)}</Text>
        </Card>
      </ScrollView>

      {/* Modals */}
      <CycleFormModal
        visible={cycleModalOpen}
        initial={editingCycle}
        onClose={() => setCycleModalOpen(false)}
        onSave={saveCycle}
        onDelete={editingCycle?.id ? removeCycle : undefined}
      />
      <SymptomFormModal
        visible={symptomModalOpen}
        initial={editingSymptom}
        onClose={() => setSymptomModalOpen(false)}
        onSave={saveSymptom}
        onDelete={editingSymptom?.id ? removeSymptom : undefined}
      />
    </SafeAreaView>
  );
}
