import React from "react";
import { View, TextInput, TouchableOpacity, ActivityIndicator, Text } from "react-native";
import { Colors, Radii, Space } from "../tokens";

export default function Composer({
  value,
  onChange,
  onSend,
  loading,
}: {
  value: string;
  onChange: (t: string) => void;
  onSend: () => void;
  loading?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.lg,
        paddingHorizontal: Space.sm,
        paddingVertical: 6,
        gap: 8,
      }}
    >
      <TextInput
        placeholder="Type a message…"
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        style={{ flex: 1, fontSize: 16, paddingVertical: 8 }}
      />
      <TouchableOpacity
        onPress={onSend}
        style={{ backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radii.md, opacity: loading ? 0.7 : 1 }}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>}
      </TouchableOpacity>
    </View>
  );
}