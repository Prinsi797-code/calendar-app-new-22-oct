// app/events/countdown.tsx
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { EventType, TYPE_META } from "../../utils/countdownAssets";
import {
  CountdownEvent,
  getEventById,
  updateEvent,
} from "../../utils/countdownStorage";

type ReminderOption = "1day" | "3days" | "1week" | "none";

const REMINDER_OPTIONS: { value: ReminderOption; label: string }[] = [
  { value: "1day", label: "1 day before" },
  { value: "3days", label: "3 days before" },
  { value: "1week", label: "1 week before" },
  { value: "none", label: "None" },
];

export default function CountdownForm() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string; id: string }>();
  const [existingEvent, setExistingEvent] = useState<CountdownEvent | null>(
    null,
  );

  const eventType =
    (params.type as EventType) || existingEvent?.type || "countdown";
  const typeMeta = TYPE_META[eventType];

  useEffect(() => {
    if (!params.id) return;
    getEventById(params.id).then((ev) => {
      if (!ev) return;
      setExistingEvent(ev);
      setTitle(ev.title);
      setSelectedDate(ev.date ? new Date(ev.date) : new Date());
      setSelectedReminders(
        (ev.reminders as ReminderOption[]).length
          ? (ev.reminders as ReminderOption[])
          : ["1day"],
      );
      setRepeatEnabled(ev.repeat === "yearly");
    });
  }, [params.id]);

  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<ReminderOption[]>([
    "1day",
  ]);
  const [repeatEnabled, setRepeatEnabled] = useState(false);

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
  };

  const toggleReminder = (reminder: ReminderOption) => {
    if (selectedReminders.includes(reminder)) {
      setSelectedReminders(selectedReminders.filter((r) => r !== reminder));
    } else {
      setSelectedReminders([...selectedReminders, reminder]);
    }
  };

  const handleNext = async () => {
    if (!title.trim()) {
      alert("Please enter event name");
      return;
    }

    const dateString = selectedDate.toISOString();

    if (existingEvent) {
      await updateEvent({
        ...existingEvent,
        title: title.trim(),
        date: dateString,
        reminders: selectedReminders,
        repeat: repeatEnabled ? "yearly" : "none",
      });
      router.back();
      return;
    }

    router.push({
      pathname: "/events/countdownStyle",
      params: {
        title: title.trim(),
        type: eventType,
        date: dateString,
        ignoreYear: "false",
        reminders: JSON.stringify(selectedReminders),
        repeat: repeatEnabled ? "yearly" : "none",
      },
    });
  };

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.circleBtn}>
          <Feather name="chevron-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {existingEvent ? "Edit Event" : `New ${typeMeta.label}`}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Form Section */}
      <FlatList
        data={[{ key: "form" }]}
        keyExtractor={(item) => item.key}
        renderItem={() => (
          <View style={styles.formContainer}>
            {/* Title Input */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Event Name
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <MaterialCommunityIcons
                  name={typeMeta.icon}
                  size={20}
                  color={typeMeta.color}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Enter event name"
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  style={[styles.input, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            {/* Date Picker */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Date
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <Feather
                  name="calendar"
                  size={20}
                  color={typeMeta.color}
                  style={styles.inputIcon}
                />
                <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                  {formattedDate}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
              />
            )}

            {/* Reminders Section */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Reminders
              </Text>
              <View style={styles.remindersGrid}>
                {REMINDER_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleReminder(option.value)}
                    style={[
                      styles.reminderChip,
                      {
                        backgroundColor: selectedReminders.includes(
                          option.value,
                        )
                          ? typeMeta.color
                          : colors.cardBackground,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selectedReminders.includes(option.value)
                          ? "#fff"
                          : colors.textPrimary,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Repeat Option */}
            <View style={styles.section}>
              <View style={styles.repeatHeader}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  Repeat Yearly
                </Text>
                <Pressable
                  onPress={() => setRepeatEnabled(!repeatEnabled)}
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: repeatEnabled
                        ? typeMeta.color
                        : colors.cardBackground,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      {
                        transform: [{ translateX: repeatEnabled ? 20 : 0 }],
                      },
                    ]}
                  />
                </Pressable>
              </View>
            </View>

            {/* Info Box */}
            <View
              style={[
                styles.infoBox,
                { backgroundColor: typeMeta.color + "15" },
              ]}
            >
              <MaterialCommunityIcons
                name="information"
                size={18}
                color={typeMeta.color}
              />
              <Text
                style={[styles.infoText, { color: typeMeta.color }]}
                numberOfLines={2}
              >
                You can select style and photo in the next step
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />

      {/* Next Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: typeMeta.color }]}
        >
          <Text style={styles.nextBtnText}>
            {existingEvent ? "Save Changes" : "Continue"}
          </Text>
          <Feather
            name={existingEvent ? "check" : "arrow-right"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  remindersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reminderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  repeatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    gap: 12,
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
