// components/ForceUpdateModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";

const IOS_STORE_URL = "https://apps.apple.com/app/id6756920857";
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME";

export default function ForceUpdateModal({ visible }: { visible: boolean }) {
  const handleUpdate = () => {
    Linking.openURL(Platform.OS === "ios" ? IOS_STORE_URL : ANDROID_STORE_URL);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.desc}>
            A new version with bug fixes and improvements is available. Please
            update to continue using the app.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={handleUpdate}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#FF5252",
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
