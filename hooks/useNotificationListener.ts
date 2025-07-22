import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth to get current user ID

export function NotificationListenerComponent() {
  const { sessionUser } = useAuth(); // Get logged-in user's ID

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const { type, user_id } = notification.request.content.data || {};

      // 🚨 Ignore SOS alerts if the sender is the logged-in user
      if (type === "SOS" && user_id === sessionUser?.id) {
        console.log("🛑 Ignoring self-triggered SOS notification.");
        return;
      }

      // ✅ Play SOS alert sound for volunteers
      if (type === "SOS" && sessionUser?.role === "volunteer") {
        console.log("🚨 SOS ALERT RECEIVED!");

        try {
          const { sound } = await Audio.Sound.createAsync(
            require("../assets/sounds/sos-sound.wav") // Make sure this file exists!
          );
          await sound.playAsync();
        } catch (error) {
          console.error("❌ Error playing SOS sound:", error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [sessionUser]); // Add sessionUser to dependencies to react to user login changes

  return null;
}
