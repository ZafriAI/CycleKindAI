import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, format, parseISO } from "date-fns";

type Cycle = { id: number; start_date: string; end_date?: string | null; flow_intensity?: number | null; notes?: string | null; };
type SymptomLog = { id: number; date: string; symptom: string; severity?: number | null; };

export default function CycleCalendar({
  cycles, symptoms,
  onRequestAddCycle, onRequestAddSymptom, // <— new props
}: {
  cycles: any[];
  symptoms: any[];
  onRequestAddCycle: (startISO: string) => void;
  onRequestAddSymptom: (dateISO: string) => void;
}) {
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const out: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) { out.push(d); d = addDays(d, 1); }
    return out;
  }, [month]);

  const cycleDays = useMemo(() => {
    const set = new Set<string>();
    const cs = [...cycles].sort((a,b) => a.start_date.localeCompare(b.start_date));
    for (let i=0;i<cs.length;i++){
      const c = cs[i];
      const start = parseISO(c.start_date);
      const end = c.end_date ? parseISO(c.end_date) : (i+1<cs.length ? addDays(parseISO(cs[i+1].start_date), -1) : addDays(start, 27));
      let d = start;
      while (d <= end) { set.add(format(d, "yyyy-MM-dd")); d = addDays(d,1); }
    }
    return set;
  }, [cycles]);

  const symptomsByDay = useMemo(() => {
    const m = new Map<string, SymptomLog[]>();
    for (const s of symptoms) {
      const iso = s.date;
      const arr = m.get(iso) || [];
      arr.push(s); m.set(iso, arr);
    }
    return m;
  }, [symptoms]);

  return (
    <View style={{ borderWidth:1, borderRadius:12, padding:12, backgroundColor:"#fff" }}>
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Text style={{ fontSize:18, fontWeight:"600" }}>{format(month, "MMMM yyyy")}</Text>
        <View style={{ flexDirection:"row", gap:8 }}>
          <TouchableOpacity onPress={() => setMonth(subMonths(month,1))}><Text>◀︎</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setMonth(startOfMonth(new Date()))}><Text>•</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setMonth(addMonths(month,1))}><Text>▶︎</Text></TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:6 }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <Text key={d} style={{ width:"14.28%", textAlign:"center", color:"#666" }}>{d}</Text>
        ))}
      </View>

      <View style={{ flexDirection:"row", flexWrap:"wrap" }}>
        {days.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const inMonth = isSameMonth(d, month);
          const isToday = isSameDay(d, new Date());
          const inCycle = cycleDays.has(iso);
          const logs = symptomsByDay.get(iso) || [];
          return (
            <View key={iso} style={{
              width:"14.28%", padding:4, opacity: inMonth ? 1 : 0.5
            }}>
              <TouchableOpacity
                onPress={() => onRequestAddSymptom(iso)}
                onLongPress={() => onRequestAddCycle(iso)}
                style={{
                  borderWidth:1, borderRadius:8, padding:6,
                  backgroundColor: inCycle ? "#fde8ef" : "#fff",
                  borderColor: isToday ? "#4f46e5" : "#e5e7eb"
                }}
              >
                <Text style={{ textAlign:"right", fontWeight: isToday ? "700" : "400" }}>{format(d, "d")}</Text>
                <View style={{ flexDirection:"row", flexWrap:"wrap", gap:4, marginTop:4 }}>
                  {logs.slice(0,3).map(l => (
                    <View key={l.id} style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:999, paddingHorizontal:6, paddingVertical:2 }}>
                      <Text style={{ fontSize:10 }}>{l.symptom}{l.severity ? `:${l.severity}` : ""}</Text>
                    </View>
                  ))}
                  {logs.length > 3 && <Text style={{ fontSize:10, color:"#666" }}>+{logs.length-3}</Text>}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <Text style={{ marginTop:8, color:"#666" }}>
        Tip: tap a day to add a symptom (cramps:3), long-press to start a cycle on that date.
      </Text>
    </View>
  );
}
