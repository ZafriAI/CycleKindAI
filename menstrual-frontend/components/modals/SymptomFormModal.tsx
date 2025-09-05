import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

type Symptom = { id?: number; date: string; symptom: string; severity?: number | null; tags?: Record<string, any> | null; notes?: string | null; };

export default function SymptomFormModal({
  visible, onClose, initial, onSave, onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  initial?: Symptom;
  onSave: (body: Symptom) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
}) {
  const [form, setForm] = useState<Symptom>({ date:"", symptom:"", severity:null, tags:null, notes:"" });
  const set = (k: keyof Symptom, v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm({
      id: initial?.id,
      date: initial?.date || "",
      symptom: initial?.symptom || "",
      severity: initial?.severity ?? null,
      tags: initial?.tags ?? null,
      notes: initial?.notes ?? "",
    });
  }, [initial, visible]);

  const parseTags = (t: string) => {
    if (!t.trim()) return null;
    try { return JSON.parse(t); }
    catch { Alert.alert("Invalid tags JSON"); return form.tags ?? null; }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.4)", justifyContent:"flex-end" }}>
        <View style={{ backgroundColor:"#fff", padding:16, borderTopLeftRadius:16, borderTopRightRadius:16 }}>
          <Text style={{ fontSize:18, fontWeight:"700", marginBottom:8 }}>{form.id ? "Edit symptom" : "New symptom"}</Text>

          <Text>Date (YYYY-MM-DD)</Text>
          <TextInput value={form.date} onChangeText={(t)=>set("date", t)} placeholder="2025-11-19"
            style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:8, marginBottom:8 }} />

          <Text>Symptom</Text>
          <TextInput value={form.symptom} onChangeText={(t)=>set("symptom", t)} placeholder="cramps"
            style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:8, marginBottom:8 }} />

          <Text>Severity (1–5)</Text>
          <TextInput value={form.severity?.toString() ?? ""} keyboardType="number-pad"
            onChangeText={(t)=>set("severity", t ? parseInt(t,10) : null)}
            style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:8, marginBottom:8 }} />

          <Text>Tags (JSON)</Text>
          <TextInput defaultValue={form.tags ? JSON.stringify(form.tags) : ""} onChangeText={(t)=>set("tags", parseTags(t))}
            placeholder='{"trigger":"coffee"}'
            style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:8, marginBottom:8 }} />

          <Text>Notes</Text>
          <TextInput value={form.notes ?? ""} onChangeText={(t)=>set("notes", t)} placeholder="notes"
            style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:8, marginBottom:16 }} />

          <View style={{ flexDirection:"row", justifyContent:"space-between", gap:8 }}>
            {form.id && onDelete && (
              <TouchableOpacity onPress={()=>onDelete!(form.id!)} style={{ padding:12, backgroundColor:"#fee2e2", borderRadius:10 }}>
                <Text style={{ color:"#b91c1c", fontWeight:"600" }}>Delete</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex:1 }} />
            <TouchableOpacity onPress={onClose} style={{ padding:12 }}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>onSave(form)} style={{ padding:12, backgroundColor:"#111827", borderRadius:10 }}>
              <Text style={{ color:"#fff", fontWeight:"600" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
