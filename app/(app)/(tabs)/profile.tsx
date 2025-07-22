import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Avatar, Button, Text, IconButton } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { sessionUser, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF416C", "#FF4B2B"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Avatar.Image
            size={100}
            source={{ uri: "https://randomuser.me/api/portraits/women/50.jpg" }}
            style={styles.avatar}
          />
          <Text style={styles.welcomeText}>
            {sessionUser ? `Welcome back!` : "Not Logged In"}
          </Text>
          <Text style={styles.userEmail}>
            {sessionUser?.email || "No Email Available"}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={24} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>User Name</Text>
              </View>
              <IconButton
                icon="pencil"
                size={20}
                iconColor="#FF416C"
                onPress={() => {}}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={24} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Emergency Contact</Text>
                <Text style={styles.infoValue}>+91 XXXXXXXXXX</Text>
              </View>
              <IconButton
                icon="pencil"
                size={20}
                iconColor="#FF416C"
                onPress={() => {}}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={24} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>Current Location</Text>
              </View>
              <IconButton
                icon="pencil"
                size={20}
                iconColor="#FF416C"
                onPress={() => {}}
              />
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#4CAF50", "#2E7D32"]}
              style={styles.actionGradient}
            >
              <Ionicons name="settings-outline" size={24} color="#FFF" />
              <Text style={styles.actionText}>Settings</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#2196F3", "#1976D2"]}
              style={styles.actionGradient}
            >
              <Ionicons name="help-circle-outline" size={24} color="#FFF" />
              <Text style={styles.actionText}>Help</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          style={styles.signOutButton}
          labelStyle={styles.signOutLabel}
          onPress={handleSignOut}
        >
          Sign Out
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  headerContent: {
    alignItems: "center",
  },
  avatar: {
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  infoCard: {
    borderRadius: 15,
    elevation: 4,
    backgroundColor: "#FFF",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  actionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  signOutButton: {
    backgroundColor: "#FF416C",
    borderRadius: 12,
    marginTop: "auto",
  },
  signOutLabel: {
    fontSize: 16,
    paddingVertical: 5,
  },
});
