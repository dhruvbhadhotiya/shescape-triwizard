import vision from "@google-cloud/vision";
import sharp from "sharp";

const client = new vision.ImageAnnotatorClient({
    keyFilename: "../utils/key/fleet-range-453600-k8-f7cef54a78e6.json",
});

/**
 * Extract Aadhaar details (Text + Face) from an image using Google Cloud Vision API.
 */
export async function extractAadhaarDetails(imageBase64) {
    try {
        if (!imageBase64) {
            throw new Error("🚨 Image data is required.");
        }

        console.log("📷 Processing Aadhaar OCR & Face Extraction...");

        const imageBuffer = Buffer.from(imageBase64, "base64");

        // Perform OCR (Extract Aadhaar Text)
        const [textResult] = await client.textDetection({ image: { content: imageBuffer } });
        const detections = textResult.textAnnotations;

        if (!detections || detections.length === 0) {
            throw new Error("⚠️ No text detected in Aadhaar image.");
        }

        const text = detections[0].description;
        console.log("🔍 Extracted OCR Text:", text);

        // Extract Aadhaar Number (Masked Format: XXXX XXXX 1234)
        const aadhaarMatch = text.match(/\b(?:XXXX\sXXXX\s\d{4})\b/);

        // Extract DOB
        const dobMatch = text.match(/\b(?:\d{2}[-/]\d{2}[-/]\d{4}|\d{4})\b/);
        const dob = dobMatch ? dobMatch[0] : "Unknown";

        // Extract Name (Assuming it is above DOB)
        const lines = text.split("\n").map(line => line.trim());
        let name = "Unknown";

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/\b(?:Year of Birth|DOB|Date of Birth)\b/i)) {
                if (i > 0) {
                    name = lines[i - 1];
                }
                break;
            }
        }

        if (name.match(/\d/)) {
            name = "Unknown"; // If OCR incorrectly detects numbers, discard it
        }

        // ✅ Extract Aadhaar Photo using Face Detection
        console.log("🔍 Detecting Face for Aadhaar Photo...");
        const [faceResult] = await client.faceDetection({ image: { content: imageBuffer } });

        if (!faceResult.faceAnnotations || faceResult.faceAnnotations.length === 0) {
            console.log("❌ No face detected in Aadhaar.");
            throw new Error("No face detected in Aadhaar.");
        }

        const face = faceResult.faceAnnotations[0];
        const vertices = face.boundingPoly.vertices;

        if (vertices.length !== 4) {
            console.log("❌ Invalid face bounding box.");
            throw new Error("Invalid face bounding box.");
        }

        const x = vertices[0].x;
        const y = vertices[0].y;
        const width = vertices[2].x - x;
        const height = vertices[2].y - y;

        // Crop Aadhaar face using Sharp
        const croppedFaceBuffer = await sharp(imageBuffer)
            .extract({ left: x, top: y, width, height })
            .toFormat("png")
            .toBuffer();

        // Convert cropped face to Base64
        const aadhaarPhotoBase64 = croppedFaceBuffer.toString("base64");

        // ✅ Final Extracted Aadhaar Data
        const extractedData = {
            name,
            aadhaarNumber: aadhaarMatch ? aadhaarMatch[0] : null,
            dob,
            photo: aadhaarPhotoBase64, // Extracted face in Base64 format
        };

        console.log("✅ Extracted Aadhaar Data:", extractedData);

        if (!extractedData.aadhaarNumber) {
            throw new Error("❌ Aadhaar number not found in the image.");
        }

        return extractedData;
    } catch (error) {
        console.error("❌ OCR Processing Error:", error.message || error);
        throw new Error("Failed to extract Aadhaar details. Ensure the image is clear and contains Aadhaar text.");
    }
}
