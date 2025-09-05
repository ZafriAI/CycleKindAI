import React from "react";
import { TextInput, TextInputProps } from "react-native";

export default function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#9CA3AF"
      {...props}
      style={[{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, backgroundColor: "#fff" }, props.style]}
    />
  );
}
