import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient({
    keyFilename: "../utils/key/fleet-range-453600-k8-f7cef54a78e6.json",
});

// Function to Compare Faces
export async function matchFaces(aadhaarPhoto, selfie) {
    try {
        const [aadhaarResult] = await client.faceDetection({ image: { content: aadhaarPhoto } });
        const [selfieResult] = await client.faceDetection({ image: { content: selfie } });

        if (!aadhaarResult.faceAnnotations.length || !selfieResult.faceAnnotations.length) {
            throw new Error("No faces detected.");
        }

        // Extract facial features
        const similarityScore = calculateFaceSimilarity(aadhaarResult.faceAnnotations[0], selfieResult.faceAnnotations[0]);
        return similarityScore;
    } catch (error) {
        console.error("Face Matching Error:", error);
        throw new Error("Failed to match faces.");
    }
}

function calculateFaceSimilarity(face1, face2) {
    let score = 100;
    const features = ["joyLikelihood", "sorrowLikelihood", "angerLikelihood", "surpriseLikelihood"];

    features.forEach((feature) => {
        if (face1[feature] !== face2[feature]) score -= 10;
    });

    return score;
}
