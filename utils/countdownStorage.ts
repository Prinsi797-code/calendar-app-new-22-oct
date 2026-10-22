// utils/countdownStorage.ts - UPDATED

import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventType } from "./countdownAssets";
import { TemplateId } from "./countdownTemplates";

export interface CountdownEvent {
  id: string;
  title: string;
  type: EventType;
  date: string | null;
  ignoreYear: boolean;
  reminders: string[];
  repeat: string;
  color: string;
  photo: string | null;
  createdAt: number;
  // ✅ NEW FIELDS
  template: TemplateId; // Selected template style
  textColor?: string; // Custom text color (for color templates)
}

const KEY = "countdownEvents";

export async function getEvents(): Promise<CountdownEvent[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveEvent(event: CountdownEvent) {
  const events = await getEvents();
  events.push(event);
  await AsyncStorage.setItem(KEY, JSON.stringify(events));
}

export async function updateEvent(event: CountdownEvent) {
  const events = await getEvents();
  const index = events.findIndex((e) => e.id === event.id);
  if (index !== -1) {
    events[index] = event;
    await AsyncStorage.setItem(KEY, JSON.stringify(events));
  }
}

export async function getEventById(id: string): Promise<CountdownEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.id === id) ?? null;
}

export async function deleteEvent(id: string) {
  const events = await getEvents();
  const filtered = events.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}

// Update template for event
export async function updateEventTemplate(
  id: string,
  template: TemplateId,
  textColor?: string
) {
  const event = await getEventById(id);
  if (event) {
    event.template = template;
    if (textColor) event.textColor = textColor;
    await updateEvent(event);
  }
}

// Update event photo
export async function updateEventPhoto(id: string, photoUri: string) {
  const event = await getEventById(id);
  if (event) {
    event.photo = photoUri;
    await updateEvent(event);
  }
}