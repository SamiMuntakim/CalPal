const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");

// Load environment variables from .env file (only used in development)
dotenv.config();

const isEasBuild = process.env.EAS_BUILD === "true";
const isProd = process.env.APP_ENV === "production";
const env = isProd ? "production" : "development";

let localConfig = {};
if (!isEasBuild) {
  try {
    if (fs.existsSync("./app.config.local.js")) {
      localConfig = require("./app.config.local.js");
    }
  } catch (error) {
    console.warn("Error loading local config:", error.message);
  }
}

const firebaseConfig = {
  apiKey:
    process.env.FIREBASE_API_KEY ||
    localConfig.firebase?.apiKey ||
    "YOUR_FIREBASE_API_KEY",
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN ||
    localConfig.firebase?.authDomain ||
    "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId:
    process.env.FIREBASE_PROJECT_ID ||
    localConfig.firebase?.projectId ||
    "YOUR_FIREBASE_PROJECT_ID",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ||
    localConfig.firebase?.storageBucket ||
    "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId:
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    localConfig.firebase?.messagingSenderId ||
    "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId:
    process.env.FIREBASE_APP_ID ||
    localConfig.firebase?.appId ||
    "YOUR_FIREBASE_APP_ID",
};

const revenueCatConfig = {
  apiKeyIOS:
    process.env.REVENUECAT_API_KEY_IOS ||
    localConfig.revenueCat?.apiKeyIOS ||
    "",
  apiKeyAndroid:
    process.env.REVENUECAT_API_KEY_ANDROID ||
    localConfig.revenueCat?.apiKeyAndroid ||
    "",
};

module.exports = {
  name: "CalPal",
  slug: "calpal-ai",
  version: "4",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  userInterfaceStyle: "light",
  scheme: "calpal",
  newArchEnabled: true,
  owner: "x1supreme",
  updates: {
    url: "https://u.expo.dev/e8f43e11-6ca9-4b2f-8445-487ffdc1c69a",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#ffffff",
    },
    package: "com.calpal.ai",
    versionCode: 4,
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "BILLING", // Required for in-app purchases
    ],
    runtimeVersion: "4",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.calpal.ai",
    buildNumber: "2",
    infoPlist: {
      NSCameraUsageDescription:
        "CalPal uses the camera to capture photos of your food for nutritional analysis. These photos are processed to estimate calories and nutrients.",
      NSPhotoLibraryUsageDescription:
        "CalPal accesses your photos to analyze food images for nutritional content.",
      NSUserTrackingUsageDescription:
        "This identifier will be used to provide you with personalized ads and subscription services. We respect your privacy choice.",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
  },
  splash: {
    image: "./assets/images/logo.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  web: {
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-camera",
    "expo-image-picker",
    "expo-tracking-transparency",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/logo.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
  extra: {
    firebaseApiKey: firebaseConfig.apiKey,
    firebaseAuthDomain: firebaseConfig.authDomain,
    firebaseProjectId: firebaseConfig.projectId,
    firebaseStorageBucket: firebaseConfig.storageBucket,
    firebaseMessagingSenderId: firebaseConfig.messagingSenderId,
    firebaseAppId: firebaseConfig.appId,
    geminiApiKey:
      process.env.GEMINI_API_KEY ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      localConfig.geminiApiKey ||
      "",
    revenueCatApiKeyIOS: revenueCatConfig.apiKeyIOS,
    revenueCatApiKeyAndroid: revenueCatConfig.apiKeyAndroid,
    eas: {
      projectId: "e8f43e11-6ca9-4b2f-8445-487ffdc1c69a",
    },
    environment: env,
  },
  legalContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  legalLink: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  subscriptionInfo: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
};
