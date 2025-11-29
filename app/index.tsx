import { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
  SafeAreaView,
  Platform,
} from "react-native";
import { useRouter, Redirect } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as TrackingTransparency from "expo-tracking-transparency";

export default function Home() {
  const { isLoading: authLoading, user, authReady } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hide the splash screen once we've determined auth state and Firebase is ready
    if (authReady && !authLoading && !profileLoading) {
      SplashScreen.hideAsync();
      setIsCheckingProfile(false);
    }
  }, [authReady, authLoading, profileLoading]);

  useEffect(() => {
    const requestTrackingPermission = async () => {
      if (Platform.OS === "ios") {
        try {
          const { status } =
            await TrackingTransparency.requestTrackingPermissionsAsync();
          console.log(`Tracking permission status: ${status}`);
        } catch (error) {
          console.error("Error requesting tracking permission:", error);
        }
      }
    };

    // Request tracking permission after a short delay
    // Apple recommends requesting permission when the app is fully launched
    if (authReady && !authLoading && !profileLoading) {
      setTimeout(() => {
        requestTrackingPermission();
      }, 1000);
    }
  }, [authReady, authLoading, profileLoading]);

  // Show loading until Firebase Auth is ready
  if (!authReady || authLoading || profileLoading || isCheckingProfile) {
    // Show loading indicator while checking auth state and profile
    return (
      <SafeAreaView style={styles.container}>
        {/* Decorative background logos */}
        <Image
          source={require("../assets/images/logo2.png")}
          style={[styles.decorativeLogo, styles.logoTopRight]}
          resizeMode="contain"
        />
        <Image
          source={require("../assets/images/logo2.png")}
          style={[styles.decorativeLogo, styles.logoBottomLeft]}
          resizeMode="contain"
        />

        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  // Now Firebase Auth is ready, we can trust the user state
  // Redirect based on authentication status and profile completion
  if (user) {
    // Check if user needs onboarding
    // A user needs onboarding if:
    // 1. No profile exists, or
    // 2. Profile has the default name "User" (indicating it was just created with defaults)
    // 3. Profile name is empty
    const needsOnboarding =
      !profile || !profile.name || profile.name === "User";

    if (needsOnboarding) {
      console.log("User needs onboarding, redirecting to setup/welcome");
      // New user needs to complete onboarding
      return <Redirect href="/setup/welcome" />;
    } else {
      console.log("User has completed onboarding, redirecting to tabs");
      // User has completed onboarding, go to main app
      return <Redirect href="/(tabs)" />;
    }
  } else {
    // User is not logged in, redirect to onboarding
    return <Redirect href="/onboarding/welcome" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  // New styles for decorative logos
  decorativeLogo: {
    position: "absolute",
    opacity: 0.08,
    width: 120,
    height: 120,
  },
  logoTopRight: {
    top: 20,
    right: -30,
    transform: [{ rotate: "10deg" }],
  },
  logoBottomLeft: {
    bottom: 20,
    left: -30,
    transform: [{ rotate: "-10deg" }],
  },
});
