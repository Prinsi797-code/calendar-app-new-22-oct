import AsyncStorage from "@react-native-async-storage/async-storage";

export const CASHBOOK_KEY = "cashbook_entries";

export interface CashItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  rate: number;
}

export interface CashEntry {
  id: string;
  type: "in" | "out";
  amount: number;
  note: string;
  timestamp: number; // date + time combined (ms)
  items: CashItem[];
  bills: string[]; // image uris
}

export const loadEntries = async (): Promise<CashEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(CASHBOOK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveEntries = async (entries: CashEntry[]) => {
  await AsyncStorage.setItem(CASHBOOK_KEY, JSON.stringify(entries));
};

export const formatAmount = (n: number) =>
  Math.round(n * 100) / 100 === Math.round(n)
    ? Math.round(n).toLocaleString("en-IN")
    : n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
