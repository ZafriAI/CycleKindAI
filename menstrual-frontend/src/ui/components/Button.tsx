import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

type Props = { title: string; onPress: () => void | Promise<void>; loading?: boolean; variant?: "primary"|"secondary"|"ghost"; style?: ViewStyle; };

export default function Button({ title, onPress, loading, variant="primary", style }: Props) {
  const base = { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 22, alignItems: "center" as const, justifyContent: "center" as const, borderWidth: 1 };
  const variants = { primary: { backgroundColor: "#0A84FF", borderColor: "#0A84FF", color: "#fff" }, secondary: { backgroundColor: "#fff", borderColor: "#E5E7EB", color: "#111827" }, ghost: { backgroundColor: "transparent", borderColor: "transparent", color: "#0A84FF" } } as const;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await onPress(); }}
      disabled={!!loading}
      style={[base, variants[variant], style, { opacity: loading ? 0.7 : 1 }]}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? "#fff" : "#0A84FF"} /> : <Text style={{ color: variants[variant].color, fontSize: 16, fontWeight: "700" }}>{title}</Text>}
    </TouchableOpacity>
  );
}
