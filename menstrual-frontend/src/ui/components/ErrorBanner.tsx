import React from "react";
import { View, Text } from "react-native";
import { Colors, Fonts, Space, Radii } from "../tokens";

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <View
      style={{
        backgroundColor: "#FFECEC",
        borderColor: Colors.danger,
        borderWidth: 1,
        padding: Space.sm,
        borderRadius: Radii.sm,
      }}
    >
      <Text style={{ color: Colors.danger, fontWeight: "600" }}>{message}</Text>
    </View>
  );
}