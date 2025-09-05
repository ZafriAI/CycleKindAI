import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts, Space } from "../../src/ui/tokens";
import Input from "../../src/ui/components/Input";
import Button from "../../src/ui/components/Button";
import Card from "../../src/ui/components/Card";
import { chatWithHistory } from "../../src/api";
import { loadChat, saveChat, Message as ChatMsg } from "../../src/chat/storage";

type Message = ChatMsg & { id?: string };

// --- UI atoms ---------------------------------------------------------------

function Bubble({ role, content }: Message) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const bg = isSystem ? "#F3F4F6" : isUser ? Colors.primary : Colors.surface;
  const color = isUser ? "#fff" : Colors.text;

  return (
    <View
      style={{
        marginVertical: 6,
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
      }}
    >
      <View
        style={{
          backgroundColor: bg,
          borderRadius: 18,
          paddingVertical: 10,
          paddingHorizontal: 14,
          shadowColor: "#000",
          shadowOpacity: isUser ? 0 : 0.06,
          shadowRadius: 6,
          elevation: isUser ? 0 : 2,
        }}
      >
        <Text selectable style={{ color, fontSize: 16, lineHeight: 22 }}>
          {content}
        </Text>
      </View>
    </View>
  );
}

function Typing() {
  return (
    <View style={{ alignSelf: "flex-start", marginTop: 6 }}>
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: 18,
          paddingVertical: 8,
          paddingHorizontal: 12,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Text style={{ color: Colors.text }}>…</Text>
      </View>
    </View>
  );
}

// --- Screen -----------------------------------------------------------------

export default function Chat() {
  const [input, setInput] = useState("Give me a gentle self-care tip for PMS");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const insets = useSafeAreaInsets();
  const [threadId, setThreadId] = useState<string | null>(null);


  // list + scroll helpers
  const listRef = useRef<FlatList<Message>>(null);
  const scrollToEnd = useCallback(
    () => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true })),
    []
  );

  // load persisted history once
  useEffect(() => {
    (async () => {
      const saved = await loadChat();
      if (saved.length) {
        // add ids if missing, for stability
        setMessages(saved.map((m, i) => ({ ...m, id: `m_${i}_${m.role}_${m.content.length}` })));
      }
    })();
  }, []);

  // persist history on change (strip typing/system placeholder)
  useEffect(() => {
    const t = setTimeout(() => {
      const clean = messages.filter((m) => !(m.role === "system" && m.content === "…"));
      // drop id before saving (storage schema stays clean)
      saveChat(clean.map(({ id, ...rest }) => rest));
    }, 200);
    return () => clearTimeout(t);
  }, [messages]);

  // scroll when keyboard shows
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", scrollToEnd);
    return () => sub.remove();
  }, [scrollToEnd]);

  // helpers
  const append = useCallback(
    (m: Message | Message[]) =>
      setMessages((prev) => {
        const next = Array.isArray(m) ? m : [m];
        // give ids to new messages
        const withIds = next.map((one, i) => ({
          ...one,
          id: one.id ?? `m_${Date.now()}_${i}_${one.role}`,
        }));
        return [...prev, ...withIds];
      }),
    []
  );

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // add user message immediately
    append({ role: "user", content: trimmed });
    setInput("");
    scrollToEnd();

    // show typing indicator (UI-only, not persisted)
    setTyping(true);
    setLoading(true);

    try {
      // Build full history and append the NEW user turn
      const history = messages.map(({ role, content }) => ({ role, content }));
      const res = await chatWithHistory([...history, { role: "user", content: trimmed }], threadId || undefined);
      const answer = res?.answer || "I couldn’t get a response. Please try again.";
      if (res?.threadId && res.threadId !== threadId) setThreadId(res.threadId);
      append({ role: "assistant", content: answer });
    } catch (e: any) {
      append({ role: "assistant", content: e?.message || "Error while sending. Try again." });
    } finally {
      setTyping(false);
      setLoading(false);
      scrollToEnd();
    }
  }, [append, input, loading, scrollToEnd, messages, threadId]);

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === "Enter") {
      // Optional: only on iOS feel; comment if you want multiline enter
      e.preventDefault?.();
      send();
    }
  };

  const renderItem = useCallback(({ item }: { item: Message }) => <Bubble {...item} />, []);

  const EmptyComposer = useMemo(
    () => (
      <View style={{ alignItems: "stretch", width: "100%" }}>
        <Input
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          style={{ marginBottom: 10 }}
          accessibilityLabel="Chat message"
          onKeyPress={onKeyPress}
        />
        <Button title="Send" onPress={send} loading={loading} />
      </View>
    ),
    [input, loading, send]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top}
      >
        <View style={{ flex: 1, padding: Space.md, paddingBottom: Math.max(Space.md, insets.bottom) }}>
          <Text style={{ fontSize: Fonts.title, fontWeight: "700", marginBottom: Space.sm }}>
            Chat
          </Text>

          {/* STATE A: no messages yet -> prompt at top-mid inside a Card */}
          {messages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "flex-start", paddingTop: 24 }}>
              <Card>{EmptyComposer}</Card>
            </View>
          ) : (
            // STATE B: existing messages -> chat list + pinned composer
            <>
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m, i) => m.id ?? String(i)}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 96 }}
                onContentSizeChange={scrollToEnd}
                onLayout={scrollToEnd}
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews
                initialNumToRender={12}
                windowSize={10}
              />

              {typing ? <Typing /> : null}

              {/* Composer pinned at bottom */}
              <View style={{ paddingTop: 12 }}>
                <Input
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type a message…"
                  style={{ marginBottom: 10 }}
                  accessibilityLabel="Chat message"
                  onKeyPress={onKeyPress}
                />
                <Button title="Send" onPress={send} loading={loading} />
                {loading ? (
                  <View style={{ marginTop: 10, alignItems: "center" }}>
                    <ActivityIndicator />
                  </View>
                ) : null}
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
