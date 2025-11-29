import { Platform } from "react-native";
import Constants from "expo-constants";
import Purchases from "react-native-purchases";

export const RC_API_KEYS = {
  IOS: Constants.expoConfig?.extra?.revenueCatApiKeyIOS || "",
  ANDROID: Constants.expoConfig?.extra?.revenueCatApiKeyAndroid || "",
};

// Product IDs
export const RC_PRODUCT_IDS = {
  PREMIUM_MONTHLY: "com.calpal.ai.Monthly",
  PREMIUM_YEARLY: "com.calpal.ai.Annual",
};

// Entitlement IDs
export const RC_ENTITLEMENTS = {
  PREMIUM: "Premium",
};

// Offering IDs
export const RC_OFFERINGS = {
  DEFAULT: "ofrng44a064495d",
};

export const getApiKey = (): string => {
  return Platform.OS === "ios" ? RC_API_KEYS.IOS : RC_API_KEYS.ANDROID;
};

export const configureRevenueCat = async (): Promise<boolean> => {
  try {
    if (!validateRevenueCatConfig()) {
      console.warn("RevenueCat configuration validation failed");
      return false;
    }

    await Purchases.configure({
      apiKey: getApiKey(),
      useAmazon: false,
      appUserID: null,
    });

    try {
      await Purchases.getCustomerInfo();
    } catch (refreshError) {
      console.warn("Could not fetch initial customer info:", refreshError);
    }

    return true;
  } catch (error) {
    console.error("Failed to configure RevenueCat:", error);
    return false;
  }
};

export const validateRevenueCatConfig = (): boolean => {
  try {
    if (Platform.OS === "ios" && !RC_API_KEYS.IOS) {
      console.warn("RevenueCat iOS API key is not configured");
      return false;
    }

    if (Platform.OS === "android" && !RC_API_KEYS.ANDROID) {
      console.warn("RevenueCat Android API key is not configured");
      return false;
    }

    // Check product IDs
    if (!RC_PRODUCT_IDS.PREMIUM_MONTHLY || !RC_PRODUCT_IDS.PREMIUM_YEARLY) {
      console.warn("RevenueCat product IDs are not configured properly");
      return false;
    }

    // Check entitlements
    if (!RC_ENTITLEMENTS.PREMIUM) {
      console.warn("RevenueCat entitlements are not configured properly");
      return false;
    }

    // Check offerings
    if (!RC_OFFERINGS.DEFAULT) {
      console.warn("RevenueCat offerings are not configured properly");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating RevenueCat configuration:", error);
    return false;
  }
};

export default {
  RC_API_KEYS,
  RC_PRODUCT_IDS,
  RC_ENTITLEMENTS,
  RC_OFFERINGS,
  getApiKey,
  validateRevenueCatConfig,
  configureRevenueCat,
};
