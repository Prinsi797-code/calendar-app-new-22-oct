import {
  crash,
  getCrashlytics,
  log,
  recordError,
  setCrashlyticsCollectionEnabled,
} from "@react-native-firebase/crashlytics";

const crashlytics = getCrashlytics();

export const initCrashlytics = async () => {
  try {
    await setCrashlyticsCollectionEnabled(crashlytics, !__DEV__);
  } catch (e) {
    console.log("Crashlytics init error:", e);
  }
};

export const logCrashlyticsError = (error: unknown, context?: string) => {
  try {
    if (context) log(crashlytics, context);
    recordError(
      crashlytics,
      error instanceof Error ? error : new Error(String(error)),
    );
  } catch {}
};

// ---- TEST ONLY (release se pehle button hata dena) ----
export const testFatalCrash = () => {
  log(crashlytics, "Test fatal crash button pressed");
  crash(crashlytics); // native crash, app band ho jayega
};

export const testNonFatalError = () => {
  logCrashlyticsError(
    new Error("Test non-fatal error from button"),
    "TestNonFatal",
  );
};