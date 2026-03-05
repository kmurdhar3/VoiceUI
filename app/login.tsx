import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";
import { router } from "expo-router";

const API_BASE = "https://speakit-api-78524125987.asia-southeast1.run.app";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleAuth = async () => {
    if (!email || !password) {
      showToast("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isRegisterMode
        ? `${API_BASE}/api/v1/auth/register`
        : `${API_BASE}/api/v1/auth/login`;

      const body = isRegisterMode
        ? JSON.stringify({ email, password, language: "en" })
        : JSON.stringify({ email, password });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (response.ok) {
        const data = await response.json();
        const accessToken = data.access_token || data.token || "";
        const refreshToken = data.refresh_token || "";
        await login(accessToken, refreshToken);
        router.replace("/home");
      } else if (response.status === 401) {
        showToast("Invalid email or password");
      } else if (response.status === 409) {
        showToast("Email already registered. Please log in.");
      } else {
        showToast("Something went wrong. Please try again.");
      }
    } catch (e) {
      showToast("Network error. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.appName}>SpeakIt</Text>
          <Text style={styles.tagline}>Voice to polished text</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor="#FFFFFF"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            selectionColor="#FFFFFF"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAuth}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegisterMode ? "Register" : "Log In"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsRegisterMode(!isRegisterMode)}
            style={styles.secondaryButton}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              {isRegisterMode
                ? "Already have an account? Log In"
                : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 56,
  },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "400",
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 0,
  },
  primaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#888888",
    fontSize: 14,
  },
});
