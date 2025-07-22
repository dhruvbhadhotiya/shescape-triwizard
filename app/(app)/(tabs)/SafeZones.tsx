import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { supabase } from "../../../utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function SafeZones() {
  const [safeShops, setSafeShops] = useState<any[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  // ✅ Fetch Current Device Location
  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("⚠️ Permission to access location was denied.");
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      setLocation(locationData);
    } catch (error) {
      console.error("❌ Error fetching location:", error);
    }
  };

  // ✅ Fetch Safe Shops (Volunteers' Shops)
  const fetchSafeShops = async () => {
    try {
        setLoading(true);

        const { data, error } = await supabase
            .from("profiles")
            .select("shop_name, shop_image, location, owner_name")
            .neq("shop_name", null); // ✅ Fetch only shopkeepers (shop_name should NOT be null)

        if (error) throw error;

        setSafeShops(data || []);
    } catch (error) {
        console.error("❌ Error fetching safe shops:", error);
    } finally {
        setLoading(false);
    }
};


  // 🔄 Run both fetch functions on mount
  useEffect(() => {
    fetchLocation();
    fetchSafeShops();
  }, []);

  // ✅ Show the Safe Shops List
  const renderShops = () => {
    return safeShops.map((shop: any, index: number) => (
        <View key={index} style={styles.shopCard}>
            {/* ✅ Shop Image */}
            {shop.shop_image && (
                <Image source={{ uri: shop.shop_image }} style={styles.shopImage} />
            )}

            {/* ✅ Shop Name & Owner */}
            <Text style={styles.shopName}>{shop.shop_name}</Text>
            <Text>👤 Owner: {shop.owner_name}</Text>

            {/* ✅ Open in Maps Button (Only if location exists) */}
            {shop.location && (
                <TouchableOpacity 
                    style={styles.mapButton} 
                    onPress={() => openMap(shop.location)}
                >
                    <Text style={styles.mapButtonText}>📍 Open in Maps</Text>
                </TouchableOpacity>
            )}
        </View>
    ));
};


  // ✅ Open Shop Location in Google Maps
  const openMap = (location: { latitude: number; longitude: number }) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FF416C", "#FF4B2B"]}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Safe Zones</Text>
        <Text style={styles.subtitle}>Find nearby safe shops and businesses</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF416C" />
          <Text style={styles.loadingText}>Finding safe zones near you...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Toggle Map/List View */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowMap(!showMap)}
          >
            <LinearGradient
              colors={showMap ? ["#4CAF50", "#2E7D32"] : ["#2196F3", "#1976D2"]}
              style={styles.toggleGradient}
            >
              <Ionicons 
                name={showMap ? "list" : "map"} 
                size={24} 
                color="#FFF" 
              />
              <Text style={styles.toggleButtonText}>
                {showMap ? "Show List View" : "Show Map View"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {showMap ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location?.coords.latitude ?? 0,
                  longitude: location?.coords.longitude ?? 0,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {safeShops.map((shop: any, index: number) => (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: shop.location.latitude,
                      longitude: shop.location.longitude,
                    }}
                    title={shop.shop_name}
                    description={shop.owner_name}
                  >
                    <View style={styles.markerContainer}>
                      <Ionicons name="storefront" size={24} color="#FF416C" />
                    </View>
                  </Marker>
                ))}
              </MapView>
            </View>
          ) : (
            <View style={styles.shopsList}>
              {safeShops.map((shop: any, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.shopCard}
                  onPress={() => openMap(shop.location)}
                >
                  <View style={styles.shopImageContainer}>
                    {shop.shop_image ? (
                      <Image 
                        source={{ uri: shop.shop_image }} 
                        style={styles.shopImage}
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="storefront" size={40} color="#666" />
                      </View>
                    )}
                  </View>
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName}>{shop.shop_name}</Text>
                    <View style={styles.ownerInfo}>
                      <Ionicons name="person" size={16} color="#666" />
                      <Text style={styles.ownerName}>{shop.owner_name}</Text>
                    </View>
                    <View style={styles.directionButton}>
                      <Ionicons name="navigate" size={16} color="#FF416C" />
                      <Text style={styles.directionText}>Get Directions</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerGradient: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  toggleButton: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  toggleGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  toggleButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  mapContainer: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
  },
  map: {
    width: "100%",
    height: 400,
  },
  markerContainer: {
    backgroundColor: "#FFF",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FF416C",
  },
  shopsList: {
    marginTop: 10,
  },
  shopCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
    flexDirection: "row",
  },
  shopImageContainer: {
    width: 120,
    height: 120,
  },
  shopImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  shopInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  shopName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ownerName: {
    marginLeft: 5,
    color: "#666",
    fontSize: 14,
  },
  directionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 65, 108, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  directionText: {
    color: "#FF416C",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  mapButton: {
    marginTop: 5,
    padding: 8,
    backgroundColor: "#FF416C",
    borderRadius: 5,
  },
  mapButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});
