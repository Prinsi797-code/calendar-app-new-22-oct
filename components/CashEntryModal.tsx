// components/CashEntryModal.tsx -> Cash In / Cash Out popup (add + edit)
import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useScreenTracking } from "../hooks/useScreenTracking";
import AdsManager from "../services/adsManager";
import PurchaseManager from "../services/purchaseManager";
import {
  CashEntry,
  CashItem,
  formatAmount,
  loadEntries,
  saveEntries,
} from "../utils/cashbook";

const GREEN = "#00b140";
const RED = "#ff0000";
// const BLUE = "#0099ff";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const fmtDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

interface Props {
  visible: boolean;
  initialType: "in" | "out";
  editId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CashEntryModal({
  visible,
  initialType,
  editId,
  onClose,
  onSaved,
}: Props) {
  const { colors } = useTheme();
  useScreenTracking("cash_entry_modal");
  const { t } = useTranslation();
  const [type, setType] = useState<"in" | "out">(initialType);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<CashItem[]>([]);
  const [bills, setBills] = useState<string[]>([]);

  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [draftItems, setDraftItems] = useState<CashItem[]>([]);
  const [iName, setIName] = useState("");
  const [iQty, setIQty] = useState("");
  const [iUnit, setIUnit] = useState("");
  const [iRate, setIRate] = useState("");

  const accent = type === "in" ? GREEN : RED;
  const BLUE = colors.primary;

  const toast = (m: string) =>
    Platform.OS === "android"
      ? ToastAndroid.show(m, ToastAndroid.SHORT)
      : Alert.alert(m);

  // popup khulte hi form reset ya edit data load
  useEffect(() => {
    if (!visible) return;
    setType(initialType);
    setPickerMode(null);
    setShowItems(false);
    if (!editId) {
      setAmount("");
      setNote("");
      setItems([]);
      setBills([]);
      setDate(new Date());
      setTime(new Date());
      return;
    }
    loadEntries().then((all) => {
      const e = all.find((x) => x.id === editId);
      if (!e) return;
      setType(e.type);
      setAmount(String(e.amount));
      setNote(e.note);
      setItems(e.items || []);
      setBills(e.bills || []);
      setDate(new Date(e.timestamp));
      setTime(new Date(e.timestamp));
    });
  }, [visible, editId, initialType]);

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  };

  const onPick = (_: any, selected?: Date) => {
    if (Platform.OS === "android") {
      const mode = pickerMode;
      setPickerMode(null);
      if (!selected) return;
      mode === "date" ? setDate(selected) : setTime(selected);
    } else if (selected) {
      pickerMode === "date" ? setDate(selected) : setTime(selected);
    }
  };

  // ---- Bills ----
  const addBill = () => {
    Alert.alert(t("AddBill"), "", [
      {
        text: t("Camera"),
        onPress: async () => {
          const p = await ImagePicker.requestCameraPermissionsAsync();
          if (!p.granted) return;
          const r = await ImagePicker.launchCameraAsync({ quality: 0.6 });
          if (!r.canceled) setBills((b) => [...b, r.assets[0].uri]);
        },
      },
      {
        text: t("Gallery"),
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
          if (!r.canceled) setBills((b) => [...b, r.assets[0].uri]);
        },
      },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  // ---- Items ----
  const openItems = () => {
    setDraftItems([...items]);
    setIName("");
    setIQty("");
    setIUnit("");
    setIRate("");
    setShowItems(true);
  };

  const addDraftItem = () => {
    if (!iName.trim()) return toast("Enter item name");
    const qty = parseFloat(iQty) || 1;
    const rate = parseFloat(iRate) || 0;
    setDraftItems((d) => [
      ...d,
      {
        id: Date.now().toString(),
        name: iName.trim(),
        qty,
        unit: iUnit.trim(),
        rate,
      },
    ]);
    setIName("");
    setIQty("");
    setIUnit("");
    setIRate("");
  };

  const draftTotal = draftItems.reduce((s, i) => s + i.qty * i.rate, 0);

  const confirmItems = () => {
    setItems(draftItems);
    if (draftTotal > 0) setAmount(String(draftTotal));
    setShowItems(false);
  };

  // ---- Save ----
  const persist = async (): Promise<boolean> => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast(t("EnterAmount"));
      return false;
    }
    const ts = new Date(date);
    ts.setHours(time.getHours(), time.getMinutes(), 0, 0);

    const entry: CashEntry = {
      id: editId || Date.now().toString(),
      type,
      amount: amt,
      note: note.trim(),
      timestamp: ts.getTime(),
      items,
      bills,
    };
    const all = await loadEntries();
    const updated = editId
      ? all.map((e) => (e.id === editId ? entry : e))
      : [...all, entry];
    await saveEntries(updated);
    onSaved();
    return true;
  };

  const saveAndExit = async () => {
    if (!(await persist())) return;
    const premium = await PurchaseManager.isPremium();
    onClose();
    if (!premium) {
      setTimeout(
        () => AdsManager.showEventScreenInterstitialAd("CreateCash", "save"),
        400,
      );
    }
  };

  const saveAndContinue = async () => {
    if (editId) return saveAndExit();
    if (!(await persist())) return;
    setAmount("");
    setNote("");
    setItems([]);
    setBills([]);
    toast(t("Saved"));
  };

  const border = {
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: BLUE }]}>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {type === "in" ? t("CashIn") : t("CashOut")}
            </Text>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 12 }}
          >
            <View
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              {/* Type toggle */}
              <View style={{ flexDirection: "row", gap: 14 }}>
                <TouchableOpacity
                  onPress={() => setType("in")}
                  style={[
                    styles.typeChip,
                    { backgroundColor: type === "in" ? GREEN : "#e2e2e2" },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: type === "in" ? "#fff" : "#000" },
                    ]}
                  >
                    {t("CashIn")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setType("out")}
                  style={[
                    styles.typeChip,
                    { backgroundColor: type === "out" ? RED : "#e2e2e2" },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: type === "out" ? "#fff" : "#000" },
                    ]}
                  >
                    {t("CashOut")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date + time */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                <View
                  style={[
                    styles.box,
                    border,
                    { flex: 2, flexDirection: "row", alignItems: "center" },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => shiftDate(-1)}
                    style={{ padding: 8 }}
                  >
                    <Feather
                      name="chevron-left"
                      size={20}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                    onPress={() => setPickerMode("date")}
                  >
                    <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                      {fmtDate(date)}
                    </Text>
                    <Feather name="calendar" size={20} color={BLUE} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => shiftDate(1)}
                    style={{ padding: 8 }}
                  >
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.box,
                    border,
                    {
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    },
                  ]}
                  onPress={() => setPickerMode("time")}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      textAlign: "center",
                    }}
                  >
                    {fmtTime(time)}
                  </Text>
                  <Feather name="clock" size={18} color={BLUE} />
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <View style={[styles.amountBox, { borderColor: BLUE }]}>
                <Text
                  style={[
                    styles.floatLabel,
                    { color: accent, backgroundColor: colors.cardBackground },
                  ]}
                >
                  {type === "in" ? "Cash In" : "Cash Out"}
                </Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.textPrimary }]}
                  value={amount}
                  onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                  autoFocus={!editId}
                />
              </View>

              {/* Notes */}
              <View style={[styles.box, border, { marginTop: 18 }]}>
                <TextInput
                  style={{
                    color: colors.textPrimary,
                    fontSize: 18,
                    paddingVertical: 12,
                  }}
                  placeholder={t("Notes")}
                  placeholderTextColor={colors.textSecondary}
                  value={note}
                  onChangeText={setNote}
                />
              </View>

              {/* Bills + Items */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                <TouchableOpacity
                  style={[styles.box, border, styles.actionBtn]}
                  onPress={addBill}
                >
                  <Text
                    style={[styles.actionText, { color: colors.textSecondary }]}
                  >
                    {t("AddBills")}
                    {bills.length ? ` (${bills.length})` : ""}
                  </Text>
                  <Feather name="camera" size={22} color={BLUE} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.box, border, styles.actionBtn]}
                  onPress={openItems}
                >
                  <Text
                    style={[styles.actionText, { color: colors.textSecondary }]}
                  >
                    {t("AddItems")}
                    {items.length ? ` (${items.length})` : ""}
                  </Text>
                  <Feather name="list" size={22} color={BLUE} />
                </TouchableOpacity>
              </View>

              {bills.length > 0 && (
                <ScrollView
                  horizontal
                  style={{ marginTop: 12 }}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {bills.map((uri, i) => (
                    <View key={uri + i}>
                      <Image
                        source={{ uri }}
                        style={{ width: 70, height: 70, borderRadius: 8 }}
                      />
                      <TouchableOpacity
                        style={styles.removeBill}
                        onPress={() =>
                          setBills((b) => b.filter((_, idx) => idx !== i))
                        }
                      >
                        <Feather name="x" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </ScrollView>

          {/* Bottom buttons */}
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: BLUE + "30" }]}
              onPress={saveAndExit}
            >
              <Text style={[styles.saveText, { color: BLUE }]}>
                {t("saveandexit")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: BLUE }]}
              onPress={saveAndContinue}
            >
              <Text style={[styles.saveText, { color: "#fff" }]}>
                {editId ? t("CashUpdate") : t("saveandcontinue")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date / time picker */}
          {pickerMode && Platform.OS === "android" && (
            <DateTimePicker
              value={pickerMode === "date" ? date : time}
              mode={pickerMode}
              display="default"
              onChange={onPick}
            />
          )}
          {Platform.OS === "ios" && !!pickerMode && (
            <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
              <View
                style={[
                  styles.dialog,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                {pickerMode && (
                  <DateTimePicker
                    value={pickerMode === "date" ? date : time}
                    mode={pickerMode}
                    display="spinner"
                    onChange={onPick}
                    textColor={colors.textPrimary}
                  />
                )}
                <TouchableOpacity
                  style={{ alignSelf: "flex-end", padding: 10 }}
                  onPress={() => setPickerMode(null)}
                >
                  <Text
                    style={{ color: BLUE, fontSize: 16, fontWeight: "600" }}
                  >
                    {t("ok")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add Items dialog */}
          {showItems && (
            <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
              <View
                style={[
                  styles.dialog,
                  { backgroundColor: colors.cardBackground, maxHeight: "88%" },
                ]}
              >
                <Text
                  style={[styles.dialogTitle, { color: colors.textPrimary }]}
                >
                  {t("AddItems")}
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    { color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  placeholder="Item"
                  placeholderTextColor={colors.textSecondary}
                  value={iName}
                  onChangeText={setIName}
                />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1.4,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder={t("Quantity")}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={iQty}
                    onChangeText={setIQty}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder={t("Unit")}
                    placeholderTextColor={colors.textSecondary}
                    value={iUnit}
                    onChangeText={setIUnit}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder={t("Rate")}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={iRate}
                    onChangeText={setIRate}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: BLUE }]}
                  onPress={addDraftItem}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}
                  >
                    {t("Add")}
                  </Text>
                </TouchableOpacity>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 14,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 18,
                      fontWeight: "700",
                    }}
                  >
                    {t("Item")} ({draftItems.length})
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 20,
                      fontWeight: "700",
                    }}
                  >
                    {t("Total")} {formatAmount(draftTotal)}
                  </Text>
                </View>

                <FlatList
                  style={[
                    styles.itemList,
                    { backgroundColor: colors.background },
                  ]}
                  data={draftItems}
                  keyExtractor={(i) => i.id}
                  renderItem={({ item }) => (
                    <View style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 15,
                            fontWeight: "600",
                          }}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={{ color: colors.textSecondary, fontSize: 13 }}
                        >
                          {item.qty} {item.unit} x {item.rate}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontWeight: "600",
                          marginRight: 10,
                        }}
                      >
                        {formatAmount(item.qty * item.rate)}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setDraftItems((d) =>
                            d.filter((x) => x.id !== item.id),
                          )
                        }
                      >
                        <Feather name="trash-2" size={18} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  )}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 30,
                    marginTop: 14,
                    paddingRight: 20,
                  }}
                >
                  <TouchableOpacity onPress={() => setShowItems(false)}>
                    <Text style={[styles.dialogBtn, { color: BLUE }]}>
                      {t("cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmItems}>
                    <Text style={[styles.dialogBtn, { color: BLUE }]}>
                      {t("ok")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 14,
    paddingTop: Platform.OS === "ios" ? 14 : 40,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    marginLeft: 14,
    fontWeight: "500",
  },
  card: {
    borderRadius: 16,
    padding: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  typeChip: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24 },
  typeText: { fontSize: 20 },
  box: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    minHeight: 56,
    justifyContent: "center",
  },
  amountBox: {
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 24,
    minHeight: 80,
    justifyContent: "center",
  },
  floatLabel: {
    position: "absolute",
    top: -14,
    left: 14,
    paddingHorizontal: 5,
    fontSize: 18,
  },
  amountInput: { fontSize: 24, paddingHorizontal: 12, paddingVertical: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  actionText: { fontSize: 18 },
  removeBill: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF5252",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomRow: { flexDirection: "row", gap: 10, padding: 10, paddingBottom: 20 },
  saveBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: { fontSize: 15, fontWeight: "700" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: { width: "90%", borderRadius: 28, padding: 20 },
  dialogTitle: { fontSize: 24, marginBottom: 16, marginLeft: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 17,
  },
  addBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  itemList: { height: 200, marginTop: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dialogBtn: { fontSize: 20, fontWeight: "500" },
});
