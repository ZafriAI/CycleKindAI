import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { Colors, Radii, Space, Fonts } from "../tokens";

export default function Chip({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: Colors.primarySoft,
        borderRadius: Radii.pill,
      }}
    >
      <Text style={{ color: Colors.primary, fontWeight: "600", fontSize: Fonts.small }}>{label}</Text>
    </TouchableOpacity>
  );
}