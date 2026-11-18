import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics'; // NEW
import {
  clearTransactionIOS,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  Purchase,
  PurchaseError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  Subscription,
} from 'expo-iap';

export const SUBSCRIPTION_SKUS = {
  weekly:  'com.hevin.calendar2026.weekly',
  monthly: 'com.hevin.calendar2026.monthly',
  yearly:  'com.hevin.calendar2026.yearly',
};

const PREMIUM_STATUS_KEY  = 'premium_status';
const PREMIUM_EXPIRY_KEY  = 'premium_expiry_date';
const PREMIUM_PRODUCT_KEY = 'premium_product_id';
const PREMIUM_TRANS_KEY   = 'premium_transaction_id';
const PREMIUM_DATE_KEY    = 'premium_purchase_date';

export interface PremiumInfo {
  isPremium:     boolean;
  expiryDate:    string | null;
  productId:     string | null;
  transactionId: string | null;
  purchaseDate:  string | null;
}

class PurchaseManager {
  private static instance: PurchaseManager;
  private isConnected = false;
  private purchaseUpdateSub: any = null;
  private purchaseErrorSub: any = null;

  // NEW: price info (fetchProducts se bharta hai) aur purchase flag
  private priceMap: Record<string, { price: number; currency: string }> = {};
  private purchaseInitiated = false;

  private onSuccessCallback: ((productId: string) => void) | null = null;
  private onErrorCallback:   ((error: string) => void) | null = null;

  static getInstance(): PurchaseManager {
    if (!PurchaseManager.instance) {
      PurchaseManager.instance = new PurchaseManager();
    }
    return PurchaseManager.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.isConnected) return true;

      await initConnection();
      this.isConnected = true;
      console.log('IAP Connected');

      // iOS pending transactions clear karo
      clearTransactionIOS();

      try {
        const pending = await getAvailablePurchases();
        for (const p of pending) {
          await finishTransaction({ purchase: p, isConsumable: false });
          console.log('🧹 Cleared pending transaction:', p.productId);
        }
      } catch (e) {
        console.log('Pending clear error (ok to ignore):', e);
      }

      this.purchaseUpdateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
        console.log('🛒 Purchase received:', purchase.productId);

        try {
          await finishTransaction({ purchase, isConsumable: false });
          await this.savePremium(purchase);
          await this.logRevenue(purchase); // NEW
          console.log('✅ Purchase finished & saved:', purchase.productId);
          this.onSuccessCallback?.(purchase.productId);
        } catch (err) {
          console.log('❌ finishTransaction error:', err);
          this.onErrorCallback?.('Transaction completion failed');
        }
      });

      this.purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
        console.log('❌ Purchase error:', error.code, error.message);
        this.purchaseInitiated = false; // NEW
        if (error.code !== 'E_USER_CANCELLED') {
          this.onErrorCallback?.(error.message || 'Purchase failed');
        }
      });

      return true;
    } catch (error: any) {
      if (error?.message?.includes('already connected')) {
        this.isConnected = true;
        return true;
      }
      console.log('❌ IAP init error:', error);
      return false;
    }
  }

  setCallbacks(
    onSuccess: (productId: string) => void,
    onError:   (error: string) => void
  ) {
    this.onSuccessCallback = onSuccess;
    this.onErrorCallback   = onError;
  }

  async getSubscriptionProducts(): Promise<Subscription[]> {
    try {
      const productIds = Object.values(SUBSCRIPTION_SKUS);
      console.log('🔍 Fetching product IDs:', productIds);
      const products = await fetchProducts({ skus: productIds, type: 'subs' });
      console.log('📦 Products fetched:', products.length);

      // NEW: numeric price + currency save karo (revenue logging ke liye)
      (products as any[]).forEach((p) => {
        const id = p.productId ?? p.id;
        const rawPrice = p.price ?? p.priceAmount;
        const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
        const currency = p.currency ?? p.priceCurrencyCode;
        if (id && !isNaN(price) && currency) {
          this.priceMap[id] = { price, currency };
        }
      });

      return products as Subscription[];
    } catch (error) {
      console.log('❌ fetchProducts error:', error);
      return [];
    }
  }

  async purchaseSubscription(sku: string): Promise<void> {
    try {
      console.log('🛒 Requesting subscription:', sku);
      this.purchaseInitiated = true; // NEW
      await requestPurchase({
        request: {
          apple: { sku },
          google: { skus: [sku] },
        },
        type: 'subs',
      });
    } catch (error: any) {
      this.purchaseInitiated = false; // NEW
      if (error?.code !== 'E_USER_CANCELLED') {
        console.log('requestPurchase error:', error);
        throw error;
      }
    }
  }

  // NEW: purchase revenue Firebase/Google Ads ko bhejo
  private async logRevenue(purchase: Purchase): Promise<void> {
    try {
      // sirf user ke khud kiye purchase par log karo (restore/renewal par nahi)
      if (!this.purchaseInitiated) return;
      this.purchaseInitiated = false;

      const txId = String(
        (purchase as any).transactionId ?? (purchase as any).id ?? ''
      );
      if (!txId) return;

      // duplicate logging roko
      const key = `logged_tx_${txId}`;
      if (await AsyncStorage.getItem(key)) return;
      await AsyncStorage.setItem(key, '1');

      const info = this.priceMap[purchase.productId];
      if (!info) {
        console.log('No price info for', purchase.productId);
        return;
      }

      // Free trial detect (best effort, field names version ke hisaab se alag ho sakte hain)
      const p: any = purchase;
      const isTrial =
        p.isTrialPeriod === true ||
        p.isTrialPeriodIOS === true ||
        p.offerPaymentModeIOS === 'FREETRIAL' ||
        p.offerPaymentMode === 'FREETRIAL';

      if (isTrial) {
        // trial par paisa nahi lagta, to revenue 0 rakho
        await analytics().logEvent('start_trial', {
          item_id: purchase.productId,
          currency: info.currency,
          value: 0,
        });
        console.log('📊 start_trial logged');
        return;
      }

      await analytics().logPurchase({
        value: info.price,
        currency: info.currency,
        transaction_id: txId,
        items: [{ item_id: purchase.productId }],
      });
      console.log('📊 purchase logged:', info.price, info.currency);
    } catch (e) {
      console.log('logRevenue error:', e);
    }
  }

  private async savePremium(purchase: Purchase): Promise<void> {
    try {
      const purchaseDate = new Date(
        (purchase as any).transactionDate ?? Date.now()
      );
      const expiryDate = new Date(
        purchaseDate.getTime() + this.expiryDuration(purchase.productId)
      );

      await AsyncStorage.multiSet([
        [PREMIUM_STATUS_KEY,  'true'],
        [PREMIUM_EXPIRY_KEY,  expiryDate.toISOString()],
        [PREMIUM_PRODUCT_KEY, purchase.productId],
        [PREMIUM_TRANS_KEY,   (purchase as any).transactionId ?? ''],
        [PREMIUM_DATE_KEY,    purchaseDate.toISOString()],
      ]);

      console.log('✅ Premium saved, expires:', expiryDate.toISOString());
    } catch (err) {
      console.log('❌ savePremium error:', err);
    }
  }

  private expiryDuration(productId: string): number {
    if (productId.includes('weekly'))  return 7   * 86400 * 1000;
    if (productId.includes('monthly')) return 30  * 86400 * 1000;
    if (productId.includes('yearly'))  return 365 * 86400 * 1000;
    return 7 * 86400 * 1000;
  }

  async getPremiumInfo(): Promise<PremiumInfo> {
    try {
      const pairs = await AsyncStorage.multiGet([
        PREMIUM_STATUS_KEY,
        PREMIUM_EXPIRY_KEY,
        PREMIUM_PRODUCT_KEY,
        PREMIUM_TRANS_KEY,
        PREMIUM_DATE_KEY,
      ]);
      const m: Record<string, string | null> = {};
      pairs.forEach(([k, v]) => { m[k] = v; });

      return {
        isPremium:     m[PREMIUM_STATUS_KEY] === 'true',
        expiryDate:    m[PREMIUM_EXPIRY_KEY],
        productId:     m[PREMIUM_PRODUCT_KEY],
        transactionId: m[PREMIUM_TRANS_KEY],
        purchaseDate:  m[PREMIUM_DATE_KEY],
      };
    } catch {
      return { isPremium: false, expiryDate: null, productId: null, transactionId: null, purchaseDate: null };
    }
  }

  async isPremium(): Promise<boolean> {
    const info = await this.getPremiumInfo();
    return info.isPremium;
  }

  async checkAndRestorePremium(): Promise<boolean> {
    try {
      console.log('🔄 Restoring from App Store...');
      const purchases = await getAvailablePurchases();
      if (!purchases || purchases.length === 0) {
        await this.clearPremium();
        return false;
      }

      const skus = Object.values(SUBSCRIPTION_SKUS);
      const active = purchases.find(p => skus.includes(p.productId));

      if (active) {
        await this.savePremium(active);
        console.log('✅ Premium restored:', active.productId);
        return true;
      }

      await this.clearPremium();
      return false;
    } catch (error) {
      console.log('❌ Restore error:', error);
      return this.isPremium();
    }
  }

  async clearPremium(): Promise<void> {
    await AsyncStorage.multiRemove([
      PREMIUM_STATUS_KEY,
      PREMIUM_EXPIRY_KEY,
      PREMIUM_PRODUCT_KEY,
      PREMIUM_TRANS_KEY,
      PREMIUM_DATE_KEY,
    ]);
    console.log('🗑️ Premium cleared');
  }

  removeListeners() {
    this.purchaseUpdateSub?.remove();
    this.purchaseErrorSub?.remove();
    this.purchaseUpdateSub = null;
    this.purchaseErrorSub  = null;
  }

  async disconnect(): Promise<void> {
    this.removeListeners();
    if (this.isConnected) {
      await endConnection();
      this.isConnected = false;
    }
  }
}

export default PurchaseManager.getInstance();