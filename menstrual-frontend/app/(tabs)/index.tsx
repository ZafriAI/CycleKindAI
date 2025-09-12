import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView, ScrollView, Text, View, Pressable, Alert } from "react-native";
import Card from "../../src/ui/components/Card";
import {
  listCycles,
  listSymptoms,
  getInsights,
  addCycle,
  updateCycle,
  deleteCycle,
  addSymptom,
  updateSymptom,
  deleteSymptom,
} from "../../src/api";
import CycleCalendar from "../../components/CycleCalendar";
import CycleFormModal from "../../components/modals/CycleFormModal";
import SymptomFormModal from "../../components/modals/SymptomFormModal";
import { useAuth } from "../../src/auth/useAuth";

function spansOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  // Dates are YYYY-MM-DD, so lexicographic string comparison works.
  // Inclusive ranges (DB uses '[]'): overlap unless A ends before B starts OR A starts after B ends.
  return !(aEnd < bStart || aStart > bEnd);
}

export default function Home() {
  const { token, loading } = useAuth();

  const [cycles, setCycles] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [insights, setInsights] = useState<any | null>(null);

  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<any | undefined>();
  const [editingSymptom, setEditingSymptom] = useState<any | undefined>();

  const [cycleError, setCycleError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [c, s, i] = await Promise.all([listCycles(), listSymptoms(), getInsights()]);
    setCycles(c);
    setSymptoms(s);
    setInsights(i);
  }, []);

  useEffect(() => {
    if (!loading && token) {
      reload().catch(console.error);
    }
  }, [loading, token, reload]);

  if (loading) return null;

  // Open modals (prefilled)
  const requestAddCycle = (startISO: string) => {
    setCycleError(null);
    // Policy 2: default end_date = start_date (single-day) instead of null
    setEditingCycle({ start_date: startISO, end_date: startISO, flow_intensity: null, notes: "" });
    setCycleModalOpen(true);
  };
  const requestAddSymptom = (dateISO: string) => {
    setEditingSymptom({ date: dateISO, symptom: "", severity: null, tags: null, notes: "" });
    setSymptomModalOpen(true);
  };

  // Saves
  const saveCycle = async (body: any) => {
    // Client-side preflight: warn if this span overlaps any existing one (excluding itself on edit)
    const overlaps = cycles.some((c) => {
      if (body.id && c.id === body.id) return false;
      return spansOverlap(body.start_date, body.end_date, c.start_date, c.end_date);
    });
    if (overlaps) {
      setCycleError("This cycle overlaps an existing one.");
      try {
        Alert.alert("Cannot save", "This cycle overlaps an existing one.");
      } catch {}
      return;
    }

    try {
      if (body.id) {
        await updateCycle(body.id, {
          start_date: body.start_date,
          end_date: body.end_date, // required now
          flow_intensity: body.flow_intensity ?? null,
          notes: body.notes ?? null,
        });
      } else {
        await addCycle({
          start_date: body.start_date,
          end_date: body.end_date, // required now
          flow_intensity: body.flow_intensity ?? null,
          notes: body.notes ?? null,
        });
      }
      setCycleError(null);
      setCycleModalOpen(false); // close only on success
      await reload();
    } catch (e: any) {
      const message = e?.message || "Unknown error";
      setCycleError(message);
      try {
        Alert.alert("Could not save", message);
      } catch {}
      // keep modal open so the user can adjust dates
    }
  };

  // Deletes
  const removeCycle = async (id: number) => {
    await deleteCycle(id);
    setCycleModalOpen(false);
    setCycleError(null);
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
              <Pressable
                key={c.id}
                onPress={() => {
                  setCycleError(null);
                  setEditingCycle(c);
                  setCycleModalOpen(true);
                }}
              >
                <View style={{ padding: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10 }}>
                  <Text>
                    {c.start_date} → {c.end_date}  • flow:{c.flow_intensity ?? "-"}
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
              <Pressable
                key={s.id}
                onPress={() => {
                  setEditingSymptom(s);
                  setSymptomModalOpen(true);
                }}
              >
                <View style={{ padding: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10 }}>
                  <Text>
                    {s.date} • {s.symptom}
                    {s.severity ? `:${s.severity}` : ""}
                  </Text>
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
        onClose={() => {
          setCycleModalOpen(false);
          setCycleError(null);
        }}
        onSave={saveCycle}
        onDelete={editingCycle?.id ? removeCycle : undefined}
        errorMessage={cycleError}
        onClearError={() => setCycleError(null)}
      />
      <SymptomFormModal
        visible={symptomModalOpen}
        initial={editingSymptom}
        onClose={() => setSymptomModalOpen(false)}
        onSave={async (b) => {
          try {
            if (b.id) {
              await updateSymptom(b.id, {
                date: b.date,
                symptom: b.symptom,
                severity: b.severity ?? null,
                tags: b.tags ?? null,
                notes: b.notes ?? null,
              });
            } else {
              await addSymptom({
                date: b.date,
                symptom: b.symptom,
                severity: b.severity ?? null,
                tags: b.tags ?? null,
                notes: b.notes ?? null,
              });
            }
            setSymptomModalOpen(false);
            await reload();
          } catch (e) {
            try {
              Alert.alert("Could not save symptom", "Please try again.");
            } catch {}
          }
        }}
        onDelete={removeSymptom}
      />
    </SafeAreaView>
  );
}
