import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../utils/supabase";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";

const NOTIFICATION_SERVER_URL = "https://pvt-project-vert.vercel.app" 

export default function WomanHomeScreen() {
  const { sessionUser, loading } = useAuth();
  const [SOS, setSOS] = useState(false);
  const [Volunteers, setVolunteers] = useState<any[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [userProfile, setUserProfile] = useState<{
    user_id: string;
    location: Location.LocationObject | null;
    texts: string[];
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [newText, setNewText] = useState("");
  const [isActivatingSOS, setIsActivatingSOS] = useState(false);
  const [sosStatus, setSosStatus] = useState("");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF416C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!sessionUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Please log in first.</Text>
      </SafeAreaView>
    );
  }

  const fetchLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location services to use the SOS feature.",
          [{ text: "OK" }]
        );
        return;
      }

      // Get the location with high accuracy settings
      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      console.log("Location fetched:", locationData);
      setLocation(locationData);

      // Start location updates
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation) => {
          console.log("Location updated:", newLocation);
          setLocation(newLocation);
        }
      );

    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert(
        "Location Error",
        "Failed to get accurate location. Please check your GPS settings.",
        [{ text: "OK" }]
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const getAllVolunteers = await supabase
        .from("availableVolunteers")
        .select("*");
      setVolunteers(getAllVolunteers.data || []);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSOS = async () => {
    if (!location) {
      Alert.alert(
        "Location Required",
        "Please enable location services to send an SOS signal.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!SOS) {
      setIsActivatingSOS(true);
      try {
        setSosStatus("Preparing location data...");
        // Format location data for Supabase
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy,
        };

        setSosStatus("Checking existing SOS signals...");
        // First check if there's an existing record
        const { data: existingData, error: checkError } = await supabase
          .from("allvictims")
          .select("*")
          .eq("user_id", sessionUser.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error("Error checking existing record:", checkError);
          throw new Error("Failed to check existing SOS status");
        }

        setSosStatus("Sending SOS signal...");
        let operationError;
        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from("allvictims")
            .update({
              location: locationData,
              texts: [],
            })
            .eq("user_id", sessionUser.id);
          operationError = updateError;
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from("allvictims")
            .insert([{
              user_id: sessionUser.id,
              location: locationData,
              texts: [],
            }]);
          operationError = insertError;
        }

        if (operationError) {
          console.error("Supabase operation error:", operationError);
          throw new Error(`Database operation failed: ${operationError.message}`);
        }

        setUserProfile({
          user_id: sessionUser.id,
          location,
          texts: [],
        });

        setSosStatus("Notifying nearby volunteers...");
        // Notify volunteers
        try {
          console.log("Sending notification to:", NOTIFICATION_SERVER_URL);
          const response = await fetch(`${NOTIFICATION_SERVER_URL}/send-notification`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              user_id: sessionUser.id,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date().toISOString(),
              userName: sessionUser.email
            }),
          }).catch(error => {
            console.error("Network error:", error);
            return null;
          });

          if (!response) {
            console.log("No response from notification server");
            Alert.alert(
              "SOS Activated",
              "Your SOS has been activated. Notifications will be sent when connection is restored.",
              [{ text: "OK" }]
            );
            setSOS(true);
            return;
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log("Notification Response:", result);
          
          Alert.alert(
            "SOS Activated",
            "Emergency services and nearby volunteers have been notified of your location.",
            [{ text: "OK" }]
          );
        } catch (notificationError) {
          console.error("Notification error:", notificationError);
          // Only show alert once for notification failure
          Alert.alert(
            "SOS Activated",
            "Your SOS has been activated. While there might be a delay in notifying volunteers, your location has been recorded.",
            [{ text: "OK" }]
          );
        }

        setSOS(true);
      } catch (error) {
        console.error("Error sending SOS:", error);
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to send SOS signal. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setIsActivatingSOS(false);
        setSosStatus("");
      }
    } else {
      setIsActivatingSOS(true);
      setSosStatus("Cancelling SOS signal...");
      try {
        const { error: deleteError } = await supabase
          .from("allvictims")
          .delete()
          .eq("user_id", sessionUser.id);

        if (deleteError) {
          throw new Error(`Failed to remove victim data: ${deleteError.message}`);
        }

        setUserProfile(null);
        setSOS(false);
        Alert.alert(
          "SOS Cancelled",
          "Your SOS signal has been cancelled.",
          [{ text: "OK" }]
        );
      } catch (error) {
        console.error("Error canceling SOS:", error);
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to cancel SOS signal. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setIsActivatingSOS(false);
        setSosStatus("");
      }
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#FF416C", "#FF4B2B"]}
        style={styles.background}
      />

      <View style={styles.content}>
        {isActivatingSOS && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.statusText}>{sosStatus}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.sosButton, SOS && styles.sosButtonActive]}
          onPress={handleSOS}
          disabled={isActivatingSOS}
        >
          <LinearGradient
            colors={SOS ? ["#4CAF50", "#2E7D32"] : ["#FF416C", "#FF4B2B"]}
            style={styles.sosGradient}
          >
            {isActivatingSOS ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Text style={styles.sosButtonText}>{SOS ? "CANCEL" : "SOS"}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {SOS && (
          <View style={styles.infoContainer}>
            <View style={styles.headerContainer}>
              <View style={styles.volunteerCount}>
                <Ionicons name="people" size={24} color="#FFFFFF" />
                <Text style={styles.volunteerCountText}>{Volunteers.length} Saathi's Nearby</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleSOS}
                disabled={isActivatingSOS}
              >
                <LinearGradient
                  colors={["#FF4B2B", "#FF416C"]}
                  style={styles.cancelGradient}
                >
                  {isActivatingSOS ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.cancelButtonText}>Cancel SOS</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location?.coords.latitude ?? 0,
                  longitude: location?.coords.longitude ?? 0,
                  latitudeDelta: 0.005, // More zoomed in
                  longitudeDelta: 0.005,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={true}
                showsCompass={true}
                loadingEnabled={true}
              >
                {location && (
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title="My Location"
                    description="You are here"
                  >
                    <Ionicons name="person" size={24} color="#FF416C" />
                  </Marker>
                )}

                {Volunteers.map((vol, index) => (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: vol.location.coords.latitude,
                      longitude: vol.location.coords.longitude,
                    }}
                    title={`${vol.name}'s Location`}
                    description="Coming for Help"
                  >
                    <Ionicons name="people" size={24} color="#4A90E2" />
                  </Marker>
                ))}
              </MapView>
            </View>

            <View style={styles.messageContainer}>
              <View style={styles.messageTitleContainer}>
                <Ionicons name="chatbox-ellipses" size={20} color="#333" />
                <Text style={styles.messageTitle}>Emergency Message</Text>
              </View>
              <TextInput
                style={styles.messageInput}
                onChangeText={(t) => setNewText(t)}
                placeholder="Type your message here"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={async () => {
                  if (userProfile && newText.trim()) {
                    const updatedTexts = [...userProfile.texts, newText];
                    await supabase
                      .from("allvictims")
                      .update({ texts: updatedTexts })
                      .eq("user_id", sessionUser.id);
                    setUserProfile({
                      ...userProfile,
                      texts: updatedTexts,
                    });
                    setNewText("");
                  }
                }}
              >
                <LinearGradient
                  colors={["#4CAF50", "#2E7D32"]}
                  style={styles.sendGradient}
                >
                  <Text style={styles.sendButtonText}>Send Message</Text>
                  <Ionicons name="send" size={20} color="#FFFFFF" style={styles.sendIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#555",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sosButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  sosGradient: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  sosButtonActive: {
    borderWidth: 5,
    borderColor: "#4CAF50",
  },
  sosButtonText: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },
  infoContainer: {
    marginTop: 20,
    width: "100%",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FF416C',
  },
  volunteerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
  },
  volunteerCountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  cancelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  mapContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 15,
  },
  messageContainer: {
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  messageTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  messageInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 3,
  },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  sendIcon: {
    marginLeft: 4,
  },
  statusContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  statusText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});

