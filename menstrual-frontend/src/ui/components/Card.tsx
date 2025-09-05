import React from "react";
import { View, ViewStyle } from "react-native";

export default function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }, style]}>
      {children}
    </View>
  );
}
