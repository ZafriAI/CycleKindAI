import React from "react";
import { FlatList, View } from "react-native";
import ChatBubble from "./ChatBubble";

export type Message = { role: "user" | "assistant"; content: string };

export default function MessageList({ data }: { data: Message[] }) {
  return (
    <FlatList
      data={data}
      keyExtractor={(_, idx) => String(idx)}
      contentContainerStyle={{ paddingBottom: 96 }}
      renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
    />
  );
}