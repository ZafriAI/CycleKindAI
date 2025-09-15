import React from "react";
import { Modal, View, Pressable, Text } from "react-native";
import ProfileModalBody from "./ProfileModal";

type Props = { visible: boolean; onClose: () => void };

export default function ProfileModalWrapper({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
        {/* Tap outside to close */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* Bottom sheet */}
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 16,
            paddingHorizontal: 16,
            paddingTop: 12,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 14,
            elevation: 12,
          }}
        >
          {/* Header row with red X */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: "700" }}>Profile</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close profile"
              style={{ padding: 4 }}
            >
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#EF4444" }}>✕</Text>
            </Pressable>
          </View>

          {/* Your existing content */}
          <ProfileModalBody />
        </View>
      </View>
    </Modal>
  );
}
