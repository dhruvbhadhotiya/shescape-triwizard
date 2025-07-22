import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import { Expo } from "expo-server-sdk";
// import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Supabase client
const supabaseUrl = "https://nrguygvgryfugpllkbjy.supabase.co";  // Your Supabase URL
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZ3V5Z3ZncnlmdWdwbGxrYmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MTE3NDEsImV4cCI6MjA1Njk4Nzc0MX0.fNMoD5m8xF7I0YH9GUktuHN1qNpl-CWC1DTSFn8qgFQ"; // ⚠️ Keep this secret in env file
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const expo = new Expo();

  

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

        if (error || !volunteers) {
            console.error("❌ Error fetching volunteers:", error?.message);
            return res.status(500).json({ error: "Failed to fetch volunteers" });
        }

        console.log(`✅ Found ${volunteers.length} volunteers`);

        // Filter volunteers with valid Expo push tokens
        const validVolunteers = volunteers.filter(
            (vol) => vol.push_token && Expo.isExpoPushToken(vol.push_token)
        );

        if (validVolunteers.length === 0) {
            console.warn("⚠️ No volunteers with valid push tokens.");
            return res.json({ message: "No valid volunteers to notify." });
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

        res.json({ message: "Notifications sent!" });
    } catch (err) {
        console.error("❌ Unexpected error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT =  5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
