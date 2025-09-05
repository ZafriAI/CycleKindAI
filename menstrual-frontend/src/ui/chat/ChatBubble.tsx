import React from "react";
import { View, Text } from "react-native";
import { Colors, Radii, Fonts } from "../tokens";

export default function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <View style={{ marginVertical: 6, alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "85%" }}>
      <View
        style={{
          backgroundColor: isUser ? Colors.primary : Colors.surface,
          borderRadius: Radii.lg,
          paddingVertical: 10,
          paddingHorizontal: 14,
          shadowColor: "#000",
          shadowOpacity: isUser ? 0 : 0.06,
          shadowRadius: 6,
          elevation: isUser ? 0 : 2,
        }}
      >
        <Text selectable style={{ color: isUser ? "#fff" : Colors.text, fontSize: Fonts.body, lineHeight: 22 }}>
          {content}
        </Text>
      </View>
    </View>
  );
}