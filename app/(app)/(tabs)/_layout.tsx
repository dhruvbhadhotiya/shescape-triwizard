import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function TabLayout() {
  const { sessionUser, loading } = useAuth();
  const router = useRouter();

  // Get theme colors from custom hook
  const backgroundColor = useThemeColor({}, "tabBar");
  const borderColor = useThemeColor({}, "tabBarBorder");
  const activeTintColor = "#FF416C";
  const inactiveTintColor = "#666";

  useEffect(() => {
    if (!loading && !sessionUser) {
      router.replace("/auth");
    }
  }, [loading, sessionUser, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={activeTintColor} />
      </View>
    );
  }

  if (!sessionUser) {
    return <View />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      }}
    >
      {sessionUser.role === "woman" && (
        <Tabs.Screen
          name="index"
          options={{
            title: "Get Help",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? "hand-left" : "hand-left-outline"} 
                color={color} 
              />
            ),
          }}
        />
      )}
      {sessionUser.role === "volunteer" && (
        <Tabs.Screen
          name="helpSomeone"
          options={{
            title: "Help Someone",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? "people" : "people-outline"} 
                color={color} 
              />
            ),
          }}
        />
      )}
      {sessionUser.role === "shopkeeper" && (
        <Tabs.Screen
          name="SafeZones"
          options={{
            title: "Safe Zones",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={28}
                name={focused ? "home" : "home-outline"}
                color={color}
                style={{ marginBottom: -3 }}
              />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? "person-circle" : "person-circle-outline"} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
