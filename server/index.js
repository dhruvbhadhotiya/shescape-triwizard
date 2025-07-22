import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { extractAadhaarDetails } from "./ocrHandler.js";
import { validateAadhaarData } from "./aadhaarValidation.js";
import { matchFaces } from "./faceMatch.js";
import { createClient } from "@supabase/supabase-js";
import { Expo } from "expo-server-sdk";

const app = express();

// ✅ Increase the request payload size limit to 50MB
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS
app.use(cors({ origin: "*" }));
app.use((req, res, next) => {
    req.setTimeout(300000, () => { // 5 minutes
        console.error("⚠️ Request Timeout");
        res.status(408).json({ error: "Request timeout" });
    });
    next();
});

// Root route handler
app.get("/", (req, res) => {
    res.json({ 
        message: "Aarya Safety App API", 
        status: "running",
        version: "1.0.0",
        description: "Backend API for Aarya Women's Safety Application",
        endpoints: {
            "/verify-aadhaar": {
                method: "POST",
                description: "Verify Aadhaar card details and extract information"
            },
            "/match-face": {
                method: "POST",
                description: "Match face between Aadhaar photo and selfie"
            },
            "/send-notification": {
                method: "POST",
                description: "Send SOS notifications to nearby volunteers"
            }
        },
        documentation: "Contact support for API documentation"
    });
});

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || "https://nrguygvgryfugpllkbjy.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZ3V5Z3ZncnlmdWdwbGxrYmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MTE3NDEsImV4cCI6MjA1Njk4Nzc0MX0.fNMoD5m8xF7I0YH9GUktuHN1qNpl-CWC1DTSFn8qgFQ";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Aadhaar Verification Route
app.post("/verify-aadhaar", async (req, res) => {
    try {
        const { image, email } = req.body;
        if (!image) return res.status(400).json({ error: "Missing image." });
        
        // Extract Aadhaar Details
        const aadhaarData = await extractAadhaarDetails(image);
        if (!validateAadhaarData(aadhaarData)) {
            return res.status(400).json({ error: "Invalid Aadhaar data." });
        }

        // Store in Supabase
        const { error } = await supabase.from("profiles").update({
            aadhaar_number: aadhaarData.aadhaarNumber,
            name: aadhaarData.name,
            aadhaar_verified: true
        }).eq("email", email);

        if (error) throw error;

        res.json({ success: true, aadhaar: aadhaarData });
    } catch (err) {
        console.error("Aadhaar Verification Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Face Matching Route
app.post("/match-face", async (req, res) => {
    try {
        const { aadhaarPhoto, selfie, email } = req.body;
        
        console.log("✅ Received Face Match Request...");
        console.log("📤 Aadhaar Photo (First 50 chars):", aadhaarPhoto?.substring(0, 50) || "MISSING");
        console.log("📤 Selfie Photo (First 50 chars):", selfie?.substring(0, 50) || "MISSING");
        console.log("📧 Email:", email || "MISSING");

        if (!aadhaarPhoto || !selfie) {
            console.error("❌ Missing Required Data");
            return res.status(400).json({ error: "Missing data." });
        }

        // Perform Face Matching
        const similarityScore = await matchFaces(aadhaarPhoto, selfie);

        console.log("📏 Calculated Similarity Score:", similarityScore);

        if (similarityScore < 80) {
            console.error("❌ Face Match Failed: Score Below 80");
            return res.status(400).json({ error: "Face does not match Aadhaar." });
        }

        // ✅ Store in Supabase
        const { error } = await supabase.from("profiles").update({ face_verified: true }).eq("email", email);
        if (error) throw error;

        res.json({ success: true, matchScore: similarityScore });
    } catch (err) {
        console.error("🚨 Face Matching API Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Send Notification Route
app.post("/send-notification", async (req, res) => {
    try {
        const { user_id, latitude, longitude } = req.body;

        if (!user_id || !latitude || !longitude) {
            return res.status(400).json({ error: "Missing parameters" });
        }

        console.log(`🚨 New SOS from user: ${user_id}`);

        // Fetch nearby volunteers with push tokens
        const { data: volunteers, error } = await supabase
            .from("profiles")
            .select("push_token, location")
            .eq("role", "volunteer");

        if (error) {
            console.error("❌ Supabase Error:", error);
            return res.status(500).json({ 
                error: "Failed to fetch volunteers",
                details: error.message 
            });
        }

        if (!volunteers || volunteers.length === 0) {
            console.log("⚠️ No volunteers found in database");
            return res.status(404).json({ 
                error: "No volunteers found",
                message: "No volunteers are registered in the system" 
            });
        }

        console.log(`✅ Found ${volunteers.length} volunteers`);

        // Initialize Expo SDK
        const expo = new Expo();

        // Filter volunteers with valid Expo push tokens
        const validVolunteers = volunteers.filter(
            (vol) => vol.push_token && Expo.isExpoPushToken(vol.push_token)
        );

        if (validVolunteers.length === 0) {
            console.warn("⚠️ No volunteers with valid push tokens.");
            return res.json({ 
                message: "No valid volunteers to notify.",
                details: "Volunteers found but no valid push tokens"
            });
        }

        console.log(`📢 Sending notifications to ${validVolunteers.length} volunteers...`);

        // Prepare notification messages
        const messages = validVolunteers.map((vol) => ({
            to: vol.push_token,
            sound: "default",
            title: "🚨 Emergency Alert!",
            body: "A woman nearby needs help. Open the app for location details.",
            data: { latitude, longitude, type: "SOS" },
        }));

        // Send push notifications
        const chunks = expo.chunkPushNotifications(messages);
        const sendPromises = chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk));
        await Promise.all(sendPromises);

        console.log("✅ Notifications sent successfully!");

        res.json({ 
            message: "Notifications sent!",
            details: {
                totalVolunteers: volunteers.length,
                notifiedVolunteers: validVolunteers.length
            }
        });
    } catch (err) {
        console.error("❌ Unexpected error:", err);
        res.status(500).json({ 
            error: "Internal Server Error",
            details: err.message 
        });
    }
});

// Export the Express API
export default app;
