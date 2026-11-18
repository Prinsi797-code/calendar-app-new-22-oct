import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { Platform } from "react-native";

export async function requestATT() {
  if (Platform.OS !== "ios") return;
  try {
    await new Promise((r) => setTimeout(r, 500)); // app active hone do
    await requestTrackingPermissionsAsync();
  } catch (e) {
    console.log("ATT error", e);
  }
}