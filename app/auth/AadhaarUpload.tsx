import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

const BACKEND_URL = "https://pvt-project-vert.vercel.app"; // Update if needed

export default function AadhaarUpload({ setAadhaarVerified = (data: any) => {}, setAadhaarData = (data: any) => {} }) {
    const [aadhaarImage, setAadhaarImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"], // Updated for latest Expo ImagePicker
            allowsEditing: true,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setAadhaarImage(result.assets[0].uri);
            if (result.assets[0].base64) {
                uploadAadhaar(result.assets[0].base64);
            } else {
                Alert.alert("❌ Error", "Failed to get base64 image.");
            }
        }
    };

    const uploadAadhaar = async (base64Image: string) => {
        setLoading(true);
        try {
            console.log("🔼 Sending image to:", `${BACKEND_URL}/verify-aadhaar`);
        console.log("📷 Image Size:", base64Image.length);
            const response = await fetch(`${BACKEND_URL}/verify-aadhaar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64Image }),
            });
            console.log("📩 Response received:", response.status);

            const data = await response.json();
            console.log("🔍 Response Data:", data);
            if (data.success) {
                setAadhaarData(data.aadhaar);
                setAadhaarVerified(true);
                Alert.alert("✅ Aadhaar Verified!", `Welcome, ${data.aadhaar.name}`);
            } else {
                Alert.alert("❌ Verification Failed", "Unable to fetch Aadhaar details.");
            }
        } catch (error) {
            console.error("Error uploading Aadhaar:", error);
            Alert.alert("❌ Error", "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadText}>📄 Upload Aadhaar</Text>
            </TouchableOpacity>

            {aadhaarImage && <Image source={{ uri: aadhaarImage }} style={styles.preview} />}

            {loading && <ActivityIndicator size="large" color="#FF416C" />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: "center", marginVertical: 20 },
    uploadButton: { backgroundColor: "#FF416C", padding: 12, borderRadius: 8 },
    uploadText: { color: "white", fontSize: 16, fontWeight: "bold" },
    preview: { width: 200, height: 200, marginTop: 10, borderRadius: 8 },
});
