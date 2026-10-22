import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "../utils/logError";

export const saveData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    logError(error, "Error saving data:");
    return false;
  }
};

export const loadData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logError(error, "Error loading data:");
    return null;
  }
};
