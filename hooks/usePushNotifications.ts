import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";


export function usePushNotifications(userId: string, userLatitude: number, userLongitude: number) {
  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      if (!Device.isDevice) {
        Alert.alert("Push notifications require a physical device.");
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== "granted") {
        Alert.alert("Failed to get push token!");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      // Update the user's push token in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({ 
          push_token: token,
          location: { latitude: userLatitude, longitude: userLongitude }
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating push token:", error.message);
      }
    };

    registerForPushNotificationsAsync();
  }, [userId, userLatitude, userLongitude]);
}
