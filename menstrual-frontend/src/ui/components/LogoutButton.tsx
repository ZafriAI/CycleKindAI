import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../src/auth/useAuth";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
      <Text style={{ color: "#0A84FF", fontWeight: "700" }}>Log out</Text>
    </TouchableOpacity>
  );
}
