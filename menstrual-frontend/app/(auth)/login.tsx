import React, { useState } from "react";
import { SafeAreaView, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth/useAuth";

// If you added your UI system:
import Card from "../../src/ui/components/Card";
import Button from "../../src/ui/components/Button";
import Input from "../../src/ui/components/Input";
import { Colors, Fonts, Space } from "../../src/ui/tokens";

export default function Login() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("Passw0rd!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async () => {
    setError(null); setLoading(true);
    try { await login(email, password); router.replace("/(tabs)"); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || "Login failed"); }
    finally { setLoading(false); }
  };

  const doRegister = async () => {
    setError(null); setLoading(true);
    try { await register(email, password); await doLogin(); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || "Register failed"); setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors?.bg ?? "#F2F2F7" }}>
      <View style={{ flex: 1, padding: Space?.md ?? 16, justifyContent: "center" }}>
        <Text style={{ fontSize: Fonts?.title ?? 32, fontWeight: "700", marginBottom: Space?.sm ?? 10 }}>Welcome</Text>
        <Card>
          <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>Email</Text>
          <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 12, marginBottom: 6 }}>Password</Text>
          <Input value={password} onChangeText={setPassword} secureTextEntry />

          {error ? <Text style={{ color: "#FF3B30", marginTop: 8 }}>{error}</Text> : null}
          <Button title="Log in" onPress={doLogin} loading={loading} style={{ marginTop: 16 }} />
          <Button title="Create account" onPress={doRegister} variant="secondary" style={{ marginTop: 10 }} />
        </Card>
      </View>
    </SafeAreaView>
  );
}
