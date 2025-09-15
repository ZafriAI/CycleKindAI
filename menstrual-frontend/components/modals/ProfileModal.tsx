import React, { useState } from "react";
import { View, Text, Platform } from "react-native";
import Button from "../../src/ui/components/Button";
import Input from "../../src/ui/components/Input";
import Card from "../../src/ui/components/Card";
import { changePassword, exportMyData, eraseMyData, deleteAccount } from "../../src/api";
import { useAuth } from "../../src/auth/useAuth";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const bg = kind === "error" ? "#FEE2E2" : "#DCFCE7";
  const fg = kind === "error" ? "#991B1B" : "#166534";
  if (!text) return null;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 10, padding: 10 }}>
      <Text style={{ color: fg, fontWeight: "700" }}>{text}</Text>
    </View>
  );
}

export default function ProfileModalBody() {
  const router = useRouter();
  const { email, logout } = useAuth();

  // Change password
  const [cur, setCur] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // Export
  const [exBusy, setExBusy] = useState(false);
  const [exMsg, setExMsg] = useState("");       // success info
  const [exError, setExError] = useState("");

  // Erase
  const [erBusy, setErBusy] = useState(false);
  const [erMsg, setErMsg] = useState("");
  const [erError, setErError] = useState("");

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState("");

  const onChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!cur || !pw1 || !pw2) return setPwError("Please fill all fields.");
    if (pw1 !== pw2) return setPwError("Passwords don’t match.");
    if (pw1.length < 8) return setPwError("New password must be at least 8 characters.");
    setPwBusy(true);
    try {
      await changePassword(cur, pw1);                // PATCH /me/password
      setCur(""); setPw1(""); setPw2("");
      setPwSuccess("Password updated.");
      // Optional: if server invalidates tokens on change, force re-login:
      // await logout(); router.replace("/(auth)/login");
    } catch (e: any) {
      // match login.tsx style
      const apiMsg = e?.response?.data?.detail ?? e?.response?.data?.message;
      setPwError(apiMsg || e?.message || "Failed to change password.");
    } finally {
      setPwBusy(false);
    }
  };

  const onExport = async () => {
    setExError(""); setExMsg(""); setExBusy(true);
    try {
      const data = await exportMyData();             // GET /me/export
      setExMsg(`Exported ${data?.cycles?.length ?? 0} cycles & ${data?.symptoms?.length ?? 0} symptoms.`);
      const json = JSON.stringify(data, null, 2);
      const filename = `my_data_${Date.now()}.json`;

      if (Platform.OS === "web") {
        // Web download
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      } else {
        // Native share
        const path = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(path, json);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path);
      }
    } catch (e: any) {
      const apiMsg = e?.response?.data?.detail ?? e?.response?.data?.message;
      setExError(apiMsg || e?.message || "Failed to export data.");
    } finally {
      setExBusy(false);
    }
  };

  const onErase = async () => {
    setErError(""); setErMsg(""); setErBusy(true);
    try {
      await eraseMyData();                           // DELETE /me/data
      setErMsg("Your cycles and symptoms were deleted.");
    } catch (e: any) {
      const apiMsg = e?.response?.data?.detail ?? e?.response?.data?.message;
      setErError(apiMsg || e?.message || "Failed to erase data.");
    } finally {
      setErBusy(false);
    }
  };

  const onConfirmDelete = async () => {
    setDelError(""); setDelBusy(true);
    try {
      await deleteAccount();                         // DELETE /me
      // log out & go to login screen
      await logout?.();
      router.replace("/(auth)/login");
    } catch (e: any) {
      const apiMsg = e?.response?.data?.detail ?? e?.response?.data?.message;
      setDelError(apiMsg || e?.message || "Failed to delete account.");
    } finally {
      setDelBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      {/* Email */}
      <Card>
        <Text style={{ fontSize: 13, color: "#6b7280" }}>Email</Text>
        <Text style={{ marginTop: 6, fontSize: 16 }}>{email ?? "—"}</Text>
      </Card>

      {/* Change password */}
      <Card>
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>Change password</Text>
        {!!pwError && <Banner kind="error" text={pwError} />}
        {!!pwSuccess && <Banner kind="success" text={pwSuccess} />}
        <View style={{ height: 8 }} />
        <Input placeholder="Current password" value={cur} onChangeText={setCur} secureTextEntry />
        <View style={{ height: 8 }} />
        <Input placeholder="New password (min 8 chars)" value={pw1} onChangeText={setPw1} secureTextEntry />
        <View style={{ height: 8 }} />
        <Input placeholder="Confirm new password" value={pw2} onChangeText={setPw2} secureTextEntry />
        <View style={{ height: 10 }} />
        <Button title="Update password" onPress={onChangePassword} loading={pwBusy} />
      </Card>

      {/* Export data */}
      <Card>
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>Data</Text>
        {!!exError && <Banner kind="error" text={exError} />}
        {!!exMsg && <Banner kind="success" text={exMsg} />}
        <Button title="Export my data" variant="secondary" onPress={onExport} loading={exBusy} />
      </Card>

      {/* Erase data */}
      <Card>
        {!!erError && <Banner kind="error" text={erError} />}
        {!!erMsg && <Banner kind="success" text={erMsg} />}
        <Button title="Erase my data (keep account)" variant="secondary" onPress={onErase} loading={erBusy} />
      </Card>

      {/* Danger zone */}
      <Card style={{ borderColor: "#FCA5A5", borderWidth: 1, backgroundColor: "#FEF2F2" }}>
        <Text style={{ marginBottom: 8, fontWeight: "700", color: "#991B1B" }}>Danger zone</Text>
        {!!delError && <Banner kind="error" text={delError} />}
        {!confirmDelete ? (
          <Button title="Delete my account" variant="danger" onPress={() => setConfirmDelete(true)} />
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={{ color: "#991B1B" }}>This permanently deletes your account and all data.</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setConfirmDelete(false)} />
              <Button title="Confirm delete" variant="danger" onPress={onConfirmDelete} loading={delBusy} />
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
