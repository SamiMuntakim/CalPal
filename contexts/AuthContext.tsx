import React, { createContext, useState, useEffect, ReactNode } from "react";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Auth session storage key
const AUTH_SESSION_KEY = "calpal_auth_session";

// Define the User type
type User = {
  id: string;
  email: string | null;
} | null;

// Auth session for persistence
type AuthSession = {
  userId: string;
  email: string | null;
  lastLogin: number;
};

// Define the Auth context type
type AuthContextType = {
  user: User;
  isLoading: boolean;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

// Create the Auth context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  authReady: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
});

// Convert Firebase user to our app's user format
const formatUser = (firebaseUser: FirebaseUser | null): User => {
  if (!firebaseUser) return null;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
  };
};

// Save auth session to AsyncStorage as backup
const saveAuthSession = async (user: User) => {
  if (!user) {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    lastLogin: Date.now(),
  };

  try {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    console.log("Auth session saved to storage as backup");
  } catch (error) {
    console.error("Error saving auth session:", error);
  }
};

// Load auth session from AsyncStorage (fallback only)
const loadAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const sessionData = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    if (!sessionData) return null;

    return JSON.parse(sessionData) as AuthSession;
  } catch (error) {
    console.error("Error loading auth session:", error);
    return null;
  }
};

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initialize auth state with proper ready flag
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser ? "User logged in" : "No user"
      );

      const formattedUser = formatUser(firebaseUser);

      if (formattedUser) {
        // User is authenticated - trust Firebase's persistence
        setUser(formattedUser);
        // Save to AsyncStorage as backup
        await saveAuthSession(formattedUser);
      } else {
        // No user - clear state and backup
        setUser(null);
        await saveAuthSession(null);
      }

      // Mark auth as ready after first state check
      if (!authReady) {
        setAuthReady(true);
        console.log("Firebase Auth is now ready");
      }

      setIsLoading(false);

      // Handle navigation only after initial auth check
      if (initializing) {
        setInitializing(false);
      } else {
        handleAuthNavigation(formattedUser);
      }
    });

    return unsubscribe;
  }, [authReady, initializing]);

  // Handle navigation based on auth state
  const handleAuthNavigation = (currentUser: User) => {
    if (currentUser) {
      // User just logged in or signed up - go to the index which will check if onboarding is needed
      console.log("User logged in, navigating to index for routing");
      router.replace("/");
    } else {
      // User just logged out or deleted account
      console.log("User logged out, navigating to welcome");
      router.replace("/(onboarding)/welcome");
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const formattedUser = formatUser(userCredential.user);

      // Save session to AsyncStorage as backup
      await saveAuthSession(formattedUser);

      // Navigation will be handled by the auth state change listener
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const formattedUser = formatUser(userCredential.user);

      // Save session to AsyncStorage as backup
      await saveAuthSession(formattedUser);

      // Navigation will be handled by the auth state change listener
    } catch (error) {
      console.error("Sign up error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      // Clear session from AsyncStorage
      await saveAuthSession(null);

      // Sign out from Firebase
      await firebaseSignOut(auth);

      // Navigation will be handled by the auth state change listener
    } catch (error) {
      console.error("Sign out error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  // Delete account function
  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user found");

      try {
        // Clear session from AsyncStorage
        await saveAuthSession(null);

        await deleteUser(currentUser);
      } catch (error: any) {
        // Check if the error is about requiring recent login
        if (error.code === "auth/requires-recent-login") {
          // We need to prompt the user to re-authenticate
          throw new Error(
            "For security reasons, please sign out and sign in again before deleting your account."
          );
        }
        throw error;
      }
      // Navigation will be handled by the auth state change listener
    } catch (error) {
      console.error("Delete account error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authReady,
        signIn,
        signUp,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
