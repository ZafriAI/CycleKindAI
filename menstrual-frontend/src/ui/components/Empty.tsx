import React from "react";
import { View, Text } from "react-native";
import { Colors, Fonts, Space } from "../tokens";

export default function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ alignItems: "center", padding: Space.lg }}>
      <Text style={{ fontSize: Fonts.h2, fontWeight: "700", marginBottom: 6 }}>{title}</Text>
      {subtitle ? <Text style={{ color: Colors.textMuted, textAlign: "center" }}>{subtitle}</Text> : null}
    </View>
  );
}