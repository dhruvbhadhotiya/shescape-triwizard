    import React, { useState } from "react";
    import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
    import * as ImagePicker from "expo-image-picker";

    const BACKEND_URL = "https://pvt-project-vert.vercel.app"; // Update if needed

    interface AadhaarData {
        photo: string;
        // Add other properties if needed
    }

    interface AadhaarVerificationProps {
        aadhaarData: AadhaarData;
        aadhaarVerified: boolean;
    }

    export default function AadhaarVerification({ aadhaarData, aadhaarVerified }: AadhaarVerificationProps) {
        const [selfieImage, setSelfieImage] = useState<string | null>(null);
        const [matchScore, setMatchScore] = useState<number | null>(null);

        const captureSelfie = async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Camera Permission Required", "Please grant camera access to capture your selfie.");
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                base64: true,
                quality: 1, // High quality
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelfieImage(result.assets[0].base64 as string);
                if (result.assets[0].base64) {
                    console.log("📸 Selfie Captured:", result.assets[0].base64.substring(0, 50)); // Log first 50 chars for debugging
                }

            }
        };

        console.log("🔍 Aadhaar Data in AadhaarVerification:", aadhaarData);
        console.log("✅ Aadhaar Verified:", aadhaarVerified);

        const matchFace = async () => {
            if (!aadhaarData || !aadhaarData.photo || !selfieImage) {
                Alert.alert("⚠️ Missing Images", "Please upload Aadhaar and capture a selfie.");
                console.log("❌ Missing Images Debug:");
                console.log("Aadhaar Photo:", aadhaarData?.photo || "❌ NOT SET");
                console.log("Selfie Image:", selfieImage || "❌ NOT SET");
                return;  // ⛔ EXIT FUNCTION EARLY IF IMAGES ARE MISSING
            }
        
            console.log("🚀 Sending Face Match Request...");
            console.log("📤 Aadhaar Image (First 50 chars):", aadhaarData.photo.substring(0, 50));
            console.log("📤 Selfie Image (First 50 chars):", selfieImage.substring(0, 50));
        
            try {
                const response = await fetch(`${BACKEND_URL}/match-face`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ aadhaarPhoto: aadhaarData.photo, selfie: selfieImage }),
                });
        
                console.log("📩 Received response from API...");
                
                if (!response.ok) {
                    console.error("❌ Network Error:", response.status, response.statusText);
                    Alert.alert("❌ Face Match Failed", "Server error occurred.");
                    return;
                }
        
                const data = await response.json();
                console.log("📩 Face Match Response Data:", data);
        
                if (data.success) {
                    setMatchScore(data.matchScore);
                } else {
                    Alert.alert("❌ Face Match Failed", "Your face did not match the Aadhaar photo.");
                }
            } catch (error) {
                console.error("❌ Fetch Request Error:", error);
                Alert.alert("❌ Network Error", "Failed to communicate with the server.");
            }
        };
        


        return (
            <View style={styles.container}>
                <Text style={styles.title}>Face Match</Text>

                <TouchableOpacity onPress={captureSelfie} style={styles.button}>
                    <Text style={styles.buttonText}>📸 Capture Selfie</Text>
                </TouchableOpacity>

                {selfieImage && <Image source={{ uri: `data:image/png;base64,${selfieImage}` }} style={styles.preview} />}

                {selfieImage && (
                    <TouchableOpacity onPress={matchFace} style={styles.button}>
                        <Text style={styles.buttonText}>🤖 Face Match</Text>
                    </TouchableOpacity>
                )}

                {matchScore !== null && <Text style={styles.matchText}>Match Score: {matchScore.toFixed(2)}%</Text>}
            </View>
        );
    }

    const styles = StyleSheet.create({
        container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
        title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
        button: { backgroundColor: "#FF416C", padding: 12, borderRadius: 8, marginVertical: 10 },
        buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
        preview: { width: 200, height: 200, marginTop: 10, borderRadius: 100 },
        matchText: { fontSize: 18, color: "blue", fontWeight: "bold", marginVertical: 10 },
    });
