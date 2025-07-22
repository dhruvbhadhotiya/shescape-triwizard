import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function HelpSomeoneScreen() {
  const { sessionUser } = useAuth(); // Provide user identity & role
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [victims, setVictims] = useState<any[]>([]); // Women who sent SOS
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // -- 1. Role Check: Only Volunteers Can Access
  if (sessionUser?.role !== "volunteer") {
    return (
      <SafeAreaView style={styles.deniedContainer}>
        <Text style={styles.deniedText}>
          ❌ Access Denied. This screen is only for volunteers.
        </Text>
      </SafeAreaView>
    );
  }

  // -- 2. Fetch Current Location
  const fetchUserLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    } catch (error) {
      setErrorMsg("Error fetching location.");
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);

  // -- 3. Periodically Fetch Victims from "allVictims"
  useEffect(() => {
    const fetchVictims = async () => {
      const { data, error } = await supabase.from("allVictims").select("*");
      if (!error && data) {
        setVictims(data);
      }
    };

    fetchVictims();
    const intervalId = setInterval(fetchVictims, 5000); // Poll every 5s
    return () => clearInterval(intervalId);
  }, []);

  // -- 4. If Location is Loading, Show Spinner
  if (loadingLocation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF416C" />
        <Text style={styles.infoText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  // -- 5. Main UI
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FF416C", "#FF4B2B"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>🚨 Women Seeking Help</Text>
      </LinearGradient>

      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {victims.length === 0 ? (
        <View style={styles.noVictimsContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          <Text style={styles.infoText}>✅ No one needs help right now.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {victims.map((victim, idx) => (
            <View key={idx} style={styles.victimCard}>
              <Text style={styles.victimName}>{victim.name} needs help!</Text>
              <Text style={styles.keywordsText}>
                Emergency Message: {victim.texts?.length ? victim.texts.join(", ") : "None"}
              </Text>

              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: victim.location.coords.latitude,
                  longitude: victim.location.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: victim.location.coords.latitude,
                    longitude: victim.location.coords.longitude,
                  }}
                  title={`${victim.name}'s Location`}
                >
                  <View style={styles.markerContainer}>
                    <Ionicons name="alert" size={24} color="#FF416C" />
                  </View>
                </Marker>
              </MapView>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// -- Styles --
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  headerGradient: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  errorContainer: {
    padding: 10,
    backgroundColor: "#ffe0e0",
    margin: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#d00",
    fontWeight: "bold",
    textAlign: "center",
  },
  noVictimsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 120,
    alignItems: "center",
  },
  victimCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  victimName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  keywordsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
  },
  markerContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  deniedText: {
    fontSize: 18,
    color: "#888",
  },
});
