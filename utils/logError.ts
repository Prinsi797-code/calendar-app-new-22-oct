import * as Sentry from "@sentry/react-native";
import { logCrashlyticsError } from "./crashlytics";

export const logError = (error: unknown, context?: string) => {
  console.error(context || "Error:", error);
  logCrashlyticsError(error, context);
  if (!__DEV__) Sentry.captureException(error);
};