import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from "../utils/logError";

const ONBOARDING_COMPLETED_KEY = 'onboardingCompleted';
const LANGUAGE_SELECTED_KEY = 'languageSelected';

class OnboardingService {
  /**
   * Check if user has completed onboarding (language selection)
   */
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return completed === 'true';
    } catch (error) {
      logError(error, 'Error checking onboarding status:');
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      console.log('✅ Onboarding completed');
    } catch (error) {
      logError(error, 'Error completing onboarding:');
    }
  }

  /**
   * Save selected language
   */
  async saveLanguage(language: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, language);
      console.log('✅ Language saved:', language);
    } catch (error) {
      logError(error, 'Error saving language:');
    }
  }

  /**
   * Get saved language
   */
  async getLanguage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
    } catch (error) {
      logError(error, 'Error getting language:');
      return null;
    }
  }

  /**
   * Reset onboarding (for testing)
   */
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(LANGUAGE_SELECTED_KEY);
      console.log('🔄 Onboarding reset');
    } catch (error) {
      logError(error, 'Error resetting onboarding:');
    }
  }
}

export default new OnboardingService();