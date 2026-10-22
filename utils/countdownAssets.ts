// utils/countdownAssets.ts
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type EventType = "countdown" | "anniversary" | "birthday" | "holiday";

export const TYPE_META: Record<
  EventType,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }
> = {
  countdown: { label: "Countdown", icon: "timer-sand", color: "#3478F6" },
  anniversary: { label: "Anniversary", icon: "cards-heart", color: "#FF2D78" },
  birthday: { label: "Birthday", icon: "cake-variant", color: "#FF5A3C" },
  holiday: { label: "Holiday", icon: "balloon", color: "#34C759" },
};

export const COUNTDOWN_PHOTOS = [
  { key: "img1", source: require("../assets/countdown/img1.jpeg") },
  { key: "img2", source: require("../assets/countdown/img2.jpeg") },
  { key: "img3", source: require("../assets/countdown/img3.jpeg") },
  { key: "img4", source: require("../assets/countdown/img4.jpeg") },
  { key: "img5", source: require("../assets/countdown/img5.jpeg") },
  { key: "img6", source: require("../assets/countdown/img6.jpeg") },
  { key: "img7", source: require("../assets/countdown/img7.jpeg") },
  { key: "img8", source: require("../assets/countdown/img8.jpeg") },
  { key: "img9", source: require("../assets/countdown/img9.jpeg") },
  { key: "img10", source: require("../assets/countdown/img10.jpeg") },
];

export function getPhotoSource(key: string | null | undefined) {
  if (!key) return null;
  return COUNTDOWN_PHOTOS.find((p) => p.key === key)?.source ?? null;
}