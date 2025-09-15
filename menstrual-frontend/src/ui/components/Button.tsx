import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, StyleProp } from "react-native";
import * as Haptics from "expo-haptics";

const VARIANTS = {
  primary:   { container: { backgroundColor: "#0A84FF", borderColor: "#0A84FF" }, label: { color: "#fff" } },
  secondary: { container: { backgroundColor: "#fff",    borderColor: "#E5E7EB" }, label: { color: "#111827" } },
  ghost:     { container: { backgroundColor: "transparent", borderColor: "transparent" }, label: { color: "#0A84FF" } },
  danger:    { container: { backgroundColor: "#EF4444", borderColor: "#EF4444" }, label: { color: "#fff" } },
} as const;
type Variant = keyof typeof VARIANTS;

type Props = {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export default function Button({ title, onPress, loading, variant = "primary", style }: Props) {
  const base = {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
  };
  const v = VARIANTS[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={async () => {
        // Never let haptics block or throw
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
        // Run the handler; let the caller handle its own errors
        try { await onPress?.(); } catch {}
      }}
      disabled={!!loading}
      style={[base, v.container, style, { opacity: loading ? 0.7 : 1 }]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={(v.label as any).color} />
      ) : (
        <Text style={[{ fontSize: 16, fontWeight: "700" }, v.label]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
