import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";

type Cycle = { id?: number; start_date: string; end_date?: string | null; flow_intensity?: number | null; notes?: string | null; };

export default function CycleFormModal({
  visible, onClose, initial, onSave, onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  initial?: Cycle;
  onSave: (body: Cycle) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
}) {
  const [form, setForm] = useState<Cycle>({ start_date: "", end_date: null, flow_intensity: null, notes: "" });

  useEffect(() => {
    setForm({
      id: initial?.id,
      start_date: initial?.start_date || "",
      end_date: (initial?.end_date ?? null) as any,
      flow_intensity: initial?.flow_intensity ?? null,
      notes: initial?.notes ?? "",
    });
  }, [initial, visible]);

  const set = (k: keyof Cycle, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.4)", justifyContent:"flex-end" }}>
        <View style={{ backgroundColor:"#fff", padding:16, borderTopLeftRadius:16, borderTopRightRadius:16 }}>
          <Text style={{ fontSize:18, fontWeight:"700", marginBottom:8 }}>{form.id ? "Edit cycle" : "New cycle"}</Text>

          <Text>Start date (YYYY-MM-DD)</Text>
          <TextInput value={form.start_date} onChangeText={(t)=>set("start_date", t)} placeholder="2025-11-19"
            style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:8, marginBottom:8 }} />

          <Text>End date (YYYY-MM-DD or blank)</Text>
          <TextInput value={form.end_date ?? ""} onChangeText={(t)=>set("end_date", t || null)} placeholder=""
            style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:8, marginBottom:8 }} />

          <Text>Flow intensity (1–5)</Text>
          <TextInput value={form.flow_intensity?.toString() ?? ""} keyboardType="number-pad"
            onChangeText={(t)=>set("flow_intensity", t ? parseInt(t,10) : null)}
            style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:8, marginBottom:8 }} />

          <Text>Notes</Text>
          <TextInput value={form.notes ?? ""} onChangeText={(t)=>set("notes", t)} placeholder="added from calendar"
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
