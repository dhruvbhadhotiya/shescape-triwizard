import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, Image 
} from "react-native";
import * as Location from "expo-location"; // ✅ Import Location API
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { supabase } from "../../utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AadhaarUpload from "./AadhaarUpload";
import AadhaarVerification from "./AadhaarVerification";

const BACKEND_URL = "https://pvt-project-vert.vercel.app";

export default function AuthScreen() {
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"woman" | "volunteer" | "shopkeeper">("woman");
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  interface AadhaarData {
    aadhaarNumber: string;
    name: string;
    photo: string;
  }
  const [aadhaarData, setAadhaarData] = useState<AadhaarData | null>(null);

  // Additional fields for Women & Shopkeepers
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopImage, setShopImage] = useState("https://www.google.com/imgres?q=default%20shop%20img&imgurl=https%3A%2F%2Fwww.shutterstock.com%2Fimage-vector%2Fvector-red-default-stamp-isolated-260nw-1738700144.jpg&imgrefurl=https%3A%2F%2Fwww.shutterstock.com%2Fsearch%2Fdefault&docid=nEyqGzec7yPv6M&tbnid=uaKMni3YvESloM&vet=12ahUKEwjTlsSx1ZCMAxWiR2wGHVKFG7IQM3oECFsQAA..i&w=756&h=280&hcb=2&ved=2ahUKEwjTlsSx1ZCMAxWiR2wGHVKFG7IQM3oECFsQAA");
  const [ownerName, setOwnerName] = useState("");
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Function to Fetch Shopkeeper's Location
  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("❌ Location Permission Denied", "Please enable location services.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      console.log("📍 Shop Location Fetched:", loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error("❌ Error fetching location:", error);
      Alert.alert("❌ Error", "Failed to fetch location.");
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload shop image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setShopImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("❌ Error", "Email and Password are required!");
      return;
    }

    if (role === "volunteer" && !aadhaarVerified) {
      Alert.alert("❌ Aadhaar Verification Required", "Please verify your Aadhaar before signing up.");
      return;
    }

    if (role === "shopkeeper" && (!shopName || !shopImage || !ownerName || !location)) {
      Alert.alert("❌ Missing Details", "Please complete all shop details.");
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("User creation failed.");

      const userId = data.user.id;  // ✅ Capture the user's ID from Supabase Auth

      // ✅ Step 2: Prepare user data for profiles table
      let userData: any = { id: userId, email, role }
        
        // let userData: any = { email, role };
        
        if (role === "woman") {
          userData.name = name;
        } else if (role === "volunteer" && aadhaarData) {
          userData.aadhaar_number = aadhaarData.aadhaarNumber;
          userData.name = aadhaarData.name;
          userData.photo = aadhaarData.photo;
        } else if (role === "shopkeeper") {
          userData.shop_name = shopName;
          userData.shop_image = shopImage;
          userData.location = location;  // ✅ Storing extracted location
          userData.owner_name = ownerName;
        }

        const { error: insertError } = await supabase.from("profiles").upsert(userData, { onConflict: "id" });
        if (insertError) throw insertError;
      } else {
        await signIn(email, password);
      }

      router.replace("/");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255, 65, 108, 0.95)", "rgba(255, 75, 43, 0.95)"]}
        style={styles.gradientOverlay}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{isSignUp ? "Join Our Safety Network" : "Welcome Back"}</Text>
          <Text style={styles.subtitle}>
            {isSignUp 
              ? "Create your safe space with us" 
              : "Your safety is our priority"}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#FF416C" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              placeholder="Email" 
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#FF416C" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              value={password} 
              onChangeText={setPassword} 
              placeholder="Password" 
              placeholderTextColor="#999"
              secureTextEntry 
            />
          </View>

          {/* Role Selection */}
          {isSignUp && (
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I am a:</Text>
              <View style={styles.roleButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.roleButton, role === "woman" && styles.roleSelected]}
                  onPress={() => setRole("woman")}
                >
                  <Ionicons 
                    name="woman-outline" 
                    size={24} 
                    color={role === "woman" ? "#FF416C" : "#666"} 
                  />
                  <Text style={[styles.roleText, role === "woman" && styles.roleTextSelected]}>
                    Woman
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.roleButton, role === "volunteer" && styles.roleSelected]}
                  onPress={() => setRole("volunteer")}
                >
                  <Ionicons 
                    name="heart-outline" 
                    size={24} 
                    color={role === "volunteer" ? "#FF416C" : "#666"} 
                  />
                  <Text style={[styles.roleText, role === "volunteer" && styles.roleTextSelected]}>
                    Volunteer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.roleButton, role === "shopkeeper" && styles.roleSelected]}
                  onPress={() => setRole("shopkeeper")}
                >
                  <Ionicons 
                    name="home-outline" 
                    size={24} 
                    color={role === "shopkeeper" ? "#FF416C" : "#666"} 
                  />
                  <Text style={[styles.roleText, role === "shopkeeper" && styles.roleTextSelected]}>
                    Shopkeeper
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Role-specific fields */}
          {isSignUp && role === "woman" && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#FF416C" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Full Name"
                placeholderTextColor="#999" 
              />
            </View>
          )}

          {/* Existing Aadhaar verification components */}
          {isSignUp && role === "volunteer" && !aadhaarVerified && (
            <AadhaarUpload setAadhaarVerified={setAadhaarVerified} setAadhaarData={setAadhaarData} />
          )}

          {isSignUp && role === "volunteer" && aadhaarVerified && aadhaarData && (
            <AadhaarVerification aadhaarData={aadhaarData} aadhaarVerified={aadhaarVerified} />
          )}

          {/* Shopkeeper fields */}
          {isSignUp && role === "shopkeeper" && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#FF416C" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={shopName} 
                  onChangeText={setShopName} 
                  placeholder="Shop Name"
                  placeholderTextColor="#999" 
                />
              </View>
              
              <View style={styles.imageUploadContainer}>
                {shopImage ? (
                  <Image 
                    source={{ uri: shopImage }} 
                    style={styles.shopImage} 
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#FF416C" />
                    <Text style={styles.imagePlaceholderText}>No image selected</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.uploadButton} 
                  onPress={pickImage}
                >
                  <Ionicons name="camera-outline" size={20} color="#FFF" />
                  <Text style={styles.uploadButtonText}>Upload Shop Image</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#FF416C" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={ownerName} 
                  onChangeText={setOwnerName} 
                  placeholder="Owner Name"
                  placeholderTextColor="#999" 
                />
              </View>
              
              <TouchableOpacity 
                style={styles.locationButton} 
                onPress={fetchLocation}
              >
                <Ionicons name="location-outline" size={20} color="#FFF" />
                <Text style={styles.locationButtonText}>Get Shop Location</Text>
              </TouchableOpacity>

              {location && (
                <Text style={styles.locationText}>
                  📍 Location saved successfully
                </Text>
              )}
            </>
          )}

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          {loading ? (
            <ActivityIndicator size="large" color="#FF416C" style={styles.loader} />
          ) : (
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {isSignUp ? "Create Safe Account" : "Sign In Securely"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp 
                ? "Already have an account? Sign In" 
                : "New to our safety network? Join Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  gradientOverlay: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  roleButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 5,
  },
  roleSelected: {
    backgroundColor: "rgba(255, 65, 108, 0.1)",
  },
  roleText: {
    marginTop: 5,
    fontSize: 14,
    color: "#666",
  },
  roleTextSelected: {
    color: "#FF416C",
    fontWeight: "bold",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF416C",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  locationButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
  locationText: {
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 15,
  },
  error: {
    color: "#FF416C",
    textAlign: "center",
    marginBottom: 15,
  },
  loader: {
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: "#FF416C",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchButton: {
    marginTop: 20,
    alignItems: "center",
  },
  switchText: {
    color: "#FF416C",
    fontSize: 14,
  },
  imageUploadContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  shopImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePlaceholderText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF416C',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
