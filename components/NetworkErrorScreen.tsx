import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NetworkErrorScreen({
  onRetry,
  retrying,
}: {
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons name="wifi-off" size={70} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>Connection Issue</Text>
      <Text style={styles.desc}>
        You don't have an active internet connection.{"\n"}
        Please check your internet or try again later.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={onRetry}
        activeOpacity={0.85}
        disabled={retrying}
      >
        {retrying ? (
          <ActivityIndicator color="#FF5252" />
        ) : (
          <Text style={styles.btnText}>Try Again</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF5252",
    alignItems: "center",
    paddingTop: 140,
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  title: { fontSize: 30, fontWeight: "800", color: "#fff", marginBottom: 16 },
  desc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  btn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { color: "#FF5252", fontSize: 17, fontWeight: "800" },
});
