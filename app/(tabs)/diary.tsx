// app/(tabs)/diary.tsx
import { useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CashEntryModal from "../../components/CashEntryModal";
import { useTheme } from "../../contexts/ThemeContext";
import { useScreenTracking } from "../../hooks/useScreenTracking";

import {
  CashEntry,
  formatAmount,
  loadEntries,
  saveEntries,
} from "../../utils/cashbook";
type Filter = "all" | "daily" | "weekly" | "monthly" | "yearly";
const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: "all", labelKey: "all" },
  { key: "daily", labelKey: "Daily" },
  { key: "weekly", labelKey: "weekly" },
  { key: "monthly", labelKey: "monthly" },
  { key: "yearly", labelKey: "yearly" },
];
const GREEN = "#0a7a1f";
const RED = "#e00000";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const dayTitle = (ts: number) => {
  const d = new Date(ts);
  return `${DAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const timeText = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const inRange = (ts: number, f: Filter) => {
  if (f === "all") return true;
  const now = new Date();
  const d = new Date(ts);
  if (f === "daily") return dayKey(ts) === dayKey(now.getTime());
  if (f === "monthly")
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  if (f === "yearly") return d.getFullYear() === now.getFullYear();
  // weekly: current week (Sunday start)
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
};

export default function CashBookScreen() {
  const { colors } = useTheme();
  useScreenTracking("cashbook_screen");
  const { t } = useTranslation();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"in" | "out">("in");
  const [editId, setEditId] = useState<string | null>(null);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.setOptions({ headerShown: false });
      }
      loadEntries().then(setEntries);

      return () => {
        if (parentNav) {
          parentNav.setOptions({ headerShown: true });
        }
      };
    }, [navigation]),
  );

  const { groups, totalIn, totalOut } = useMemo(() => {
    const filtered = entries.filter((e) => inRange(e.timestamp, filter));

    // running balance (oldest -> newest)
    const asc = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
    const balanceMap: Record<string, number> = {};
    let bal = 0;
    let tIn = 0;
    let tOut = 0;
    asc.forEach((e) => {
      if (e.type === "in") {
        bal += e.amount;
        tIn += e.amount;
      } else {
        bal -= e.amount;
        tOut += e.amount;
      }
      balanceMap[e.id] = bal;
    });

    // group by day (newest first)
    const desc = [...asc].reverse();
    const map = new Map<
      string,
      { title: string; items: (CashEntry & { balance: number })[] }
    >();
    desc.forEach((e) => {
      const k = dayKey(e.timestamp);
      if (!map.has(k)) map.set(k, { title: dayTitle(e.timestamp), items: [] });
      map.get(k)!.items.push({ ...e, balance: balanceMap[e.id] });
    });

    return { groups: Array.from(map.values()), totalIn: tIn, totalOut: tOut };
  }, [entries, filter]);

  const balance = totalIn - totalOut;

  const openNew = (type: "in" | "out") => {
    setEditId(null);
    setModalType(type);
    setModalVisible(true);
  };

  const openEdit = (e: CashEntry) => {
    setEditId(e.id);
    setModalType(e.type);
    setModalVisible(true);
  };

  const confirmDelete = (e: CashEntry) => {
    Alert.alert(t("DeleteEntry"), t("DeleteEntryMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          const updated = entries.filter((x) => x.id !== e.id);
          setEntries(updated);
          await saveEntries(updated);
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.header, { color: colors.textPrimary }]}>
        {t("diary")}
      </Text>
      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? colors.primary
                    : colors.cardBackground,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? "#fff" : colors.textPrimary,
                  fontWeight: "600",
                }}
              >
                {t(f.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Column header */}
      <View style={styles.colHeader}>
        <Text style={[styles.colDate, { color: colors.textPrimary }]}>
          {t("Date")}
        </Text>
        <Text style={[styles.colIn, { color: GREEN }]}>{t("CashIn")}</Text>
        <Text style={[styles.colOut, { color: RED }]}>{t("CashOut")}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {groups.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {t("NoCashEntries")}
          </Text>
        ) : (
          groups.map((g) => (
            <View key={g.title}>
              <Text
                style={[
                  styles.dayTitle,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                {g.title}
              </Text>
              {g.items.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  activeOpacity={0.8}
                  onPress={() => openEdit(e)}
                  onLongPress={() => confirmDelete(e)}
                  style={[
                    styles.entry,
                    { backgroundColor: colors.cardBackground },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.entryNote, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {e.note || e.type === "in" ? t("CashIn") : t("CashOut")}
                    </Text>
                    <Text
                      style={[
                        styles.entryTime,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {timeText(e.timestamp)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.entryAmount,
                        { color: e.type === "in" ? GREEN : RED },
                      ]}
                    >
                      {formatAmount(e.amount)}
                    </Text>
                    <Text
                      style={[
                        styles.entryBalance,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("Balance")} {formatAmount(e.balance)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: "#00a844" }]}
          onPress={() => openNew("in")}
        >
          <Text style={styles.bigBtnText}>{t("CashIn")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: "#ff4444" }]}
          onPress={() => openNew("out")}
        >
          <Text style={styles.bigBtnText}>{t("CashOut")}</Text>
        </TouchableOpacity>
      </View>

      {/* Totals (tab bar ke upar jagah chhodi hai) */}
      <View
        style={[
          styles.totals,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.totalCell}>
          <Text style={[styles.totalLabel, { color: GREEN }]}>
            {t("TotalCashIn")}
          </Text>
          <Text style={[styles.totalValue, { color: GREEN }]}>
            {formatAmount(totalIn)}
          </Text>
        </View>
        <View
          style={[
            styles.totalCell,
            styles.totalMid,
            { borderColor: colors.border },
          ]}
        >
          <Text style={[styles.totalLabel, { color: RED }]}>
            {t("TotalCashOut")}
          </Text>
          <Text style={[styles.totalValue, { color: RED }]}>
            {formatAmount(totalOut)}
          </Text>
        </View>
        <View style={styles.totalCell}>
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
            {t("Balance")}
          </Text>
          <Text
            style={[styles.totalValue, { color: balance < 0 ? RED : GREEN }]}
          >
            {formatAmount(balance)}
          </Text>
        </View>
      </View>
      <View style={{ height: 100 }} />

      <CashEntryModal
        visible={modalVisible}
        initialType={modalType}
        editId={editId}
        onClose={() => setModalVisible(false)}
        onSaved={() => loadEntries().then(setEntries)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  colHeader: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  colDate: { flex: 1, fontWeight: "700", fontSize: 15 },
  colIn: { width: 80, textAlign: "center", fontWeight: "700", fontSize: 15 },
  colOut: { width: 80, textAlign: "right", fontWeight: "700", fontSize: 15 },
  dayTitle: {
    fontWeight: "700",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 2,
  },
  entryNote: { fontSize: 17, fontWeight: "500" },
  entryTime: { fontSize: 14, marginTop: 6 },
  entryAmount: { fontSize: 18, fontWeight: "700" },
  entryBalance: { fontSize: 13, marginTop: 8 },
  empty: {
    textAlign: "center",
    marginTop: 60,
    fontSize: 15,
    paddingHorizontal: 30,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  bigBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  bigBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  totals: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
  },
  totalCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  totalMid: { borderLeftWidth: 1, borderRightWidth: 1 },
  totalLabel: { fontSize: 14, textAlign: "center" },
  totalValue: { fontSize: 18, fontWeight: "600", marginTop: 4 },
});
