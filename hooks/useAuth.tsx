import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as Device from "expo-device";

type UserRole = "woman" | "volunteer" | "shopkeeper";

interface SessionUser {
  id: string;
  email?: string;
  role: UserRole;
  push_token?: string;
  location?: { latitude: number; longitude: number };
}

interface AuthContextValue {
  sessionUser: SessionUser | null;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async (userId: string) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        console.warn("User profile not found. Creating a new profile...");
        await supabase.from("profiles").insert({ id: userId, role: "woman" });
        setSessionUser({ id: userId, role: "woman" });
        return;
      }

      setSessionUser((prev) => ({
        ...prev,
        id: userId,
        role: profile.role,
        email: profile.email,
        push_token: profile.push_token,
        location: profile.location,
      }));

      if (!profile.push_token) await updatePushToken(userId);
      if (!profile.location) await updateUserLocation(userId);
    };

    const updateUserLocation = async (userId: string) => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("❌ Location permission denied.");
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      const location = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      };

      await supabase.from("profiles").update({ location }).eq("id", userId);
      setSessionUser((prev) => (prev ? { ...prev, location } : prev));
    };

    const updatePushToken = async (userId: string) => {
      if (!Device.isDevice) {
        console.warn("❌ Push notifications require a physical device.");
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("❌ Push notification permission denied.");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      if (!tokenData.data) return;

      await supabase
        .from("profiles")
        .update({ push_token: tokenData.data })
        .eq("id", userId);
      setSessionUser((prev) =>
        prev ? { ...prev, push_token: tokenData.data } : prev
      );
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setSessionUser(null);
        }
        setLoading(false);
      }
    );

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await loadUserProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    })();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 🔹 Sign Up
  const signUp = async (email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, role });
      await loadUserProfile(data.user.id);
    }
  };

  // 🔹 Sign In
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await loadUserProfile(data.user!.id);
  };

  // 🔹 Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
  };

  return (
    <AuthContext.Provider value={{ sessionUser, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
