import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../src/auth/useAuth";

// Simple gate based on route groups "(auth)" and "(tabs)"
function AuthGate() {
  const segments = useSegments();
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // wait until auth is loaded
    const inAuthGroup = segments[0] === "(auth)";
    if (!token && !inAuthGroup) router.replace("/(auth)/login");
    if (token && inAuthGroup) router.replace("/(tabs)");
  }, [segments, token, loading]);

  return <Slot />; // render matched route
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
