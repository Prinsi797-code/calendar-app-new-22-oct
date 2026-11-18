// app/(tabs)/_layout.tsx

import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BannerAdSize, GAMBannerAd } from "react-native-google-mobile-ads";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import AdsManager from "../../services/adsManager";
import OnboardingService from "../../services/OnboardingService";
import PurchaseManager from "../../services/purchaseManager";
import { trackScreen } from "../../utils/analytics";
import { initializeI18n } from "../../utils/i18n";

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: "calendar",
  challenge: "edit",
  memo: "file-text",
  // diary: "book",
  diary: "dollar-sign",
};

const BANNER_HEIGHT = 65;
const BAR_BOTTOM = 0;
const TAB_BAR_HEIGHT = 85;

function GlassTabButton({
  icon,
  label,
  isActive,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.12 : 1, {
      damping: 14,
      stiffness: 180,
    });
    glow.value = withTiming(isActive ? 1 : 0, { duration: 250 });
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(glow.value, [0, 1], [0.55, 1]),
  }));

  const glowRingStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const inactiveColor = colors.textPrimary;
  const iconColor = isActive ? colors.primary : inactiveColor;
  const labelColor = isActive ? colors.primary : inactiveColor;

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Animated.View style={[styles.iconWrapper, animStyle]}>
        <Animated.View
          style={[
            styles.glowRing,
            glowRingStyle,
            {
              // borderColor: colors.primary + '40',
              // backgroundColor: colors.primary + '15',
              // shadowColor: colors.primary,
            },
          ]}
        />
        <Feather name={icon} size={22} color={iconColor} />
      </Animated.View>
      <Animated.Text
        style={[styles.tabLabel, animStyle, { color: labelColor }]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function GlassTabBar({ state, navigation, descriptors }: any) {
  const { colors } = useTheme();

  return (
    <View style={[styles.barOuter, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.glassContainer,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const icon = TAB_ICONS[route.name] ?? "circle";
            const isActive = state.index === index;

            return (
              <GlassTabButton
                key={route.key}
                icon={icon}
                label={label}
                isActive={isActive}
                onPress={() => {
                  navigation.navigate(route.name);
                  trackScreen(route.name);
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
export default function TabLayout() {
  const { colors } = useTheme();
  const { t, i18n, ready } = useTranslation();
  const [bannerConfig, setBannerConfig] = useState<{
    show: boolean;
    id: string;
    preloadId?: string;
  } | null>(null);
  const [usePreload, setUsePreload] = useState(true);
  const [isAdsReady, setIsAdsReady] = useState(false);
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await OnboardingService.isOnboardingCompleted();
      setOnboardingComplete(completed);
    };
    checkOnboarding();
    const interval = setInterval(async () => {
      const completed = await OnboardingService.isOnboardingCompleted();
      if (completed && !onboardingComplete) {
        setOnboardingComplete(completed);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [onboardingComplete]);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeI18n();
        console.log("i18n initialized in TabLayout");
      } catch (error) {
        console.error("Error initializing i18n:", error);
      }
      setIsI18nReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isI18nReady) return;
    const onLangChange = (lng: string) => console.log("🌍 Language:", lng);
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n, isI18nReady]);

  const checkPremiumStatus = async () => {
    const premiumStatus = await PurchaseManager.isPremium();

    setIsPremium(premiumStatus);
    if (premiumStatus) setBannerConfig(null);
  };

  // useEffect(() => {
  //   const initAds = async () => {
  //     await checkPremiumStatus();
  //     const premiumStatus = await PurchaseManager.isPremium();

  //     if (premiumStatus) { setIsAdsReady(true); return; }
  //     if (!AdsManager.isConfigReady()) await AdsManager.initializeAds();
  //     setBannerConfig(AdsManager.getBannerConfig("main"));
  //     setIsAdsReady(true);
  //   };
  //   initAds();
  // }, []);

  useEffect(() => {
    const initAds = async () => {
      await checkPremiumStatus();
      const premiumStatus = await PurchaseManager.isPremium();

      if (premiumStatus) {
        setIsAdsReady(true);
        return;
      }

      if (!AdsManager.isConfigReady()) await AdsManager.initializeAds();

      let config = await AdsManager.getBannerConfig("main");
      for (let i = 0; i < 3 && !config; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        config = await AdsManager.getBannerConfig("main");
      }
      setBannerConfig(config);
      setUsePreload(!!config?.preloadId);
      setIsAdsReady(true);
    };
    initAds();
  }, []);

  if (onboardingComplete === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}
        >
          Checking onboarding...
        </Text>
      </View>
    );
  }

  if (!onboardingComplete) return null;

  if (!ready || !isI18nReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}
        >
          Loading translations...
        </Text>
      </View>
    );
  }

  // const showBanner = !isPremium && bannerConfig?.show;
  // const showBanner = !isPremium && bannerConfig?.show;
  const activeBannerId =
    usePreload && bannerConfig?.preloadId
      ? bannerConfig.preloadId
      : bannerConfig?.id;

  const showBanner = !isPremium && bannerConfig?.show && !!activeBannerId;

  // useEffect(() => {
  //   if (showBanner) {
  //     trackEvent('banner_ad_shown', { screen_name: 'main_tabs' });
  //   }
  // }, [showBanner]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { backgroundColor: "red" },
          }}
          tabBar={(props) => <GlassTabBar {...props} />}
        >
          <Tabs.Screen name="index" options={{ title: t("calendar") }} />
          <Tabs.Screen name="challenge" options={{ title: t("Challenge") }} />
          <Tabs.Screen name="memo" options={{ title: t("Memo") }} />
          <Tabs.Screen name="diary" options={{ title: t("CashBook") }} />
        </Tabs>
      </View>

      {showBanner && (
        <View style={styles.bottomAdContainer}>
          <GAMBannerAd
            key={activeBannerId}
            unitId={activeBannerId!}
            sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]}
            onAdLoaded={() =>
              console.log("Main banner loaded:", activeBannerId)
            }
            onAdFailedToLoad={(error) => {
              console.log("Main banner failed:", activeBannerId, error);
              if (usePreload && bannerConfig?.preloadId) {
                setUsePreload(false);
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12, // <- tab bar aur ad ke beech gap
    // backgroundColor: "transparent",
  },
  glassContainer: {
    height: 70,
    borderRadius: 35, // <- pura round (height / 2)
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    paddingVertical: 8,
  },
  bottomAdContainer: {
    width: "100%",
    alignItems: "center",
  },
  base: { ...StyleSheet.absoluteFillObject },
  sheen: { ...StyleSheet.absoluteFillObject },
  topShine: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 1,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  glowRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  stickyAdContainer: {
    position: "absolute",
    bottom: 90,
    width: "100%",
    alignItems: "center",
  },
  adWrapper: {
    position: "relative",
    alignItems: "center",
  },
});
