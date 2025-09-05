import React from "react";
import { View } from "react-native";
import { Colors, Radii } from "../tokens";

export default function Skeleton({ height = 16, width = "100%" }: { height?: number; width?: number | string }) {
  return (
    <View
      style={{
        height,
        width,
        backgroundColor: "#EAEAEA",
        borderRadius: Radii.sm,
      }}
    />
  );
}