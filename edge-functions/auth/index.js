// import express from "express";
// import axios from "axios";
// import cors from "cors";
// import bodyParser from "body-parser";
// import { createClient } from "@supabase/supabase-js";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // Initialize Supabase client
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// // DigiLocker Credentials (Replace with your credentials)
// const DIGILOCKER_CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID;
// const DIGILOCKER_CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET;
// const DIGILOCKER_REDIRECT_URI = process.env.DIGILOCKER_REDIRECT_URI;

// // Step 1: Redirect to DigiLocker for authentication
// app.get("/digilocker/auth", (req, res) => {
//     const authUrl = `https://digilocker.gov.in/public/oauth2/1/authorize?client_id=${DIGILOCKER_CLIENT_ID}&response_type=code&redirect_uri=${DIGILOCKER_REDIRECT_URI}`;
//     res.json({ authUrl });
// });

// // Step 2: Handle Callback & Exchange Code for Token
// app.post("/digilocker/token", async (req, res) => {
//     try {
//         const { code } = req.body;

//         if (!code) {
//             return res.status(400).json({ error: "Missing authorization code" });
//         }

//         // Exchange code for access token
//         const tokenResponse = await axios.post("https://digilocker.gov.in/public/oauth2/1/token", {
//             client_id: DIGILOCKER_CLIENT_ID,
//             client_secret: DIGILOCKER_CLIENT_SECRET,
//             grant_type: "authorization_code",
//             code,
//             redirect_uri: DIGILOCKER_REDIRECT_URI,
//         });

//         const { access_token } = tokenResponse.data;

//         // Fetch Aadhaar Data
//         const aadhaarResponse = await axios.get("https://digilocker.gov.in/public/api/1/aadhaar", {
//             headers: { Authorization: `Bearer ${access_token}` },
//         });

//         if (aadhaarResponse.data.success) {
//             const aadhaarData = aadhaarResponse.data.data;

//             res.json({
//                 success: true,
//                 aadhaar: {
//                     aadhaarNumber: aadhaarData.aadhaar_number,
//                     name: aadhaarData.name,
//                     dob: aadhaarData.dob,
//                     gender: aadhaarData.gender,
//                     photo: aadhaarData.photo,
//                 },
//             });
//         } else {
//             res.status(400).json({ success: false, error: "Aadhaar data could not be retrieved" });
//         }
//     } catch (error) {
//         console.error("Error fetching Aadhaar data:", error);
//         res.status(500).json({ success: false, error: "Server error" });
//     }
// });

// // Step 3: Store Aadhaar Data in Supabase
// app.post("/digilocker/store", async (req, res) => {
//     try {
//         const { email, aadhaarNumber, name, photo } = req.body;

//         if (!email || !aadhaarNumber || !name) {
//             return res.status(400).json({ error: "Missing required fields" });
//         }

//         const { data, error } = await supabase.from("profiles").insert({
//             email,
//             aadhaar_number: aadhaarNumber,
//             name,
//             photo,
//             role: "volunteer",
//         });

//         if (error) {
//             throw error;
//         }

//         res.json({ success: true, message: "Aadhaar data stored successfully", data });
//     } catch (error) {
//         console.error("Error storing Aadhaar data:", error);
//         res.status(500).json({ success: false, error: "Server error" });
//     }
// });

// // Start the server
// const PORT = 5001;
// app.listen(PORT, () => {
//     console.log(`🚀 Aadhaar Verification API running on port ${PORT}`);
// });
