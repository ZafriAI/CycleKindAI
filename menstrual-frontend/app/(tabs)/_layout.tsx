import React, { useState } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, View } from "react-native";
import LogoutButton from "../../src/ui/components/LogoutButton";
import ProfileModal from "../../components/modals/ProfileModalWrapper";
export default function TabsLayout() {
  const [profileOpen, setProfileOpen] = useState(false);

  const HeaderLeft = () => (
    <Pressable onPress={() => setProfileOpen(true)} style={{ paddingHorizontal: 12 }}>
      <Image
        source={{ uri: "https://ui-avatars.com/api/?name=U" }} // swap with user avatar if you have one
        style={{ width: 28, height: 28, borderRadius: 14 }}
      />
    </Pressable>
  );
  return (
    <>
      <Tabs
        screenOptions={{
          headerTitleAlign: "center",
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: { height: 84, paddingTop: 8, paddingBottom: 24 },
          tabBarActiveTintColor: "#0A84FF",
          tabBarInactiveTintColor: "#8E8E93",
          headerLeft: () => <HeaderLeft />,
          headerRight: () => <LogoutButton />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size ?? 24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ask"
          options={{
            title: "Ask",
            tabBarIcon: ({ color, size }) => <Ionicons name="help-circle-outline" size={size ?? 24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size ?? 24} color={color} />,
          }}
        />
      </Tabs>
      <ProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}