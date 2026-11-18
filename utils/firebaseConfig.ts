import remoteConfig from '@react-native-firebase/remote-config';

// ------------------------------
// SAFE FALLBACK DEFAULTS (new keys)
// ------------------------------
const REMOTE_DEFAULTS = {
  // common
  common_banner_id: '',
  common_show_banner: false,
  common_inter_id: '',
  common_show_inter: 0,

  // floor
  floor_inter_id: '',
  floor_inter_show: 0,

  // language
  language_banner_id: '',
  language_banner_show: false,
  language_banner_preload_id: '',

  // main
  main_app_open_id: '',
  main_app_open_show: 0,
  main_banner_id: '',
  main_banner_show: false,
  main_banner_preload_id: '',

  // sub
  sub_banner_id: '',
  sub_banner_show: false,
  sub_inter_id: '',
  sub_inter_show: 0,

  reward_ad_flag: 0,
  reward_id: '',
  force_update: 0,
  min_version: '1.0.0',
};

const FETCH_TIMEOUT_MS = 8000;

let isInitialized = false;
let cachedConfig: any = null; // sirf successful fetch ke baad set hota hai
let inflight: Promise<any> | null = null;

async function initRemoteConfig() {
  if (isInitialized) return;

  await remoteConfig().setConfigSettings({
    minimumFetchIntervalMillis: __DEV__ ? 0 : 0,
  });

  await remoteConfig().setDefaults(REMOTE_DEFAULTS);
  isInitialized = true;
}

async function fetchWithTimeout(): Promise<boolean> {
  try {
    const activated = await Promise.race([
      remoteConfig().fetchAndActivate(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Remote Config timeout')), FETCH_TIMEOUT_MS),
      ),
    ]);
    console.log('Remote Config fetched & activated:', activated);
    return true;
  } catch (e) {
    console.log('Remote Config fetch failed, using last/default values:', e);
    return false;
  }
}

function buildConfig() {
  const getNum = (key: string) => remoteConfig().getValue(key).asNumber();
  const getStr = (key: string) => remoteConfig().getValue(key).asString();
  // boolean (true/false) ko 1/0 me convert, kyunki adsManager ad_flag === 1 check karta hai
  const getFlag = (key: string) =>
    remoteConfig().getValue(key).asBoolean() ? 1 : 0;

  return {
    custom_theme: {
      reward_ad_flag: getNum('reward_ad_flag'),
      reward_id: getStr('reward_id'),
    },

    // detail screen -> sub inter
    detail_screen: {
      inter_ads_flag: getNum('sub_inter_show'),
      inter_id: getStr('sub_inter_id'),
    },

    // event screen -> sub banner + sub inter
    event_screen: {
      ad_flag: getFlag('sub_banner_show'),
      baner_id: getStr('sub_banner_id'),
      inter_ads_flag: getNum('sub_inter_show'),
      inter_id: getStr('sub_inter_id'),
    },

    floor_inter: {
      inter_ads_flag: getNum('floor_inter_show'),
      inter_id: getStr('floor_inter_id'),
    },

    // language banner -> language folder, language inter -> common inter
    language_screen: {
      ad_flag: getFlag('language_banner_show'),
      baner_id: getStr('language_banner_id'),
      preload_baner_id: getStr('language_banner_preload_id'),
      inter_ads_flag: getNum('common_show_inter'),
      inter_id: getStr('common_inter_id'),
    },

    main_screen: {
      ad_flag: getFlag('main_banner_show'),
      baner_id: getStr('main_banner_id'),
      preload_baner_id: getStr('main_banner_preload_id'),
      force_update: getNum('force_update'),
      min_version: getStr('min_version'),
    },

    // main_app_open_show 0 se bada ho to ad on
    main_screen_ad: {
      ad_flag: getNum('main_app_open_show') > 0 ? 1 : 0,
      inter_id: getStr('main_app_open_id'),
    },

    // setting -> common
    setting_screen: {
      ad_flag: getFlag('common_show_banner'),
      baner_id: getStr('common_banner_id'),
      inter_ads_flag: getNum('common_show_inter'),
      inter_id: getStr('common_inter_id'),
    },

    // splash ka new key nahi hai, common inter use kiya
    splash_screen: {
      inter_ads_flag: getNum('common_show_inter'),
      inter_id: getStr('common_inter_id'),
    },
  };
}


async function _fetchAppConfig() {
  try {
    await initRemoteConfig();

    const fetched = await fetchWithTimeout();
    const config = buildConfig();

    console.log('Remote Config mapped:', config);

    // Sirf successful fetch ko cache karo, warna agli call dobara fetch try kare
    if (fetched) cachedConfig = config;
    return config;
  } catch (error) {
    console.log('Remote Config init failed:', error);
    return null;
  }
}

export async function fetchAppConfig(force = false) {
  if (cachedConfig && !force) return cachedConfig;
  if (inflight) return inflight; // parallel callers ek hi fetch share karenge

  inflight = _fetchAppConfig().finally(() => {
    inflight = null;
  });
  return inflight;
}