import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Mic, Clock, Settings, FileText } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";
import { useHistory } from "@/context/HistoryContext";
import { useNotes } from "@/context/NotesContext";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "";

type RecordingState = "idle" | "recording" | "processing";

export default function HomeScreen() {
  const [state, setState] = useState<RecordingState>("idle");
  const [timer, setTimer] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const { token } = useAuth();
  const { showToast } = useToast();
  const { historyCount } = useHistory();
  const { notesCount } = useNotes();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pulseRef.current) pulseRef.current.stop();
    };
  }, []);

  const startPulse = () => {
    pulseOpacity.setValue(1);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.14,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseRef.current = animation;
    animation.start();
  };

  const stopPulse = () => {
    if (pulseRef.current) {
      pulseRef.current.stop();
      pulseRef.current = null;
    }
    Animated.parallel([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startTimer = () => {
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleRecordButton = async () => {
    if (state === "idle") {
      setState("recording");
      startPulse();
      startTimer();
      // In a real implementation, start actual recording here
      // For now we simulate the recording state
    } else if (state === "recording") {
      stopTimer();
      stopPulse();
      setState("processing");
      await processRecording();
    }
  };

  const processRecording = async () => {
    try {
      // Simulate API call - in production this would send actual audio
      const response = await fetch(`${API_BASE}/api/v1/transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio_uri: audioUri, duration: timer }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push({ pathname: "/results", params: { data: JSON.stringify(data) } });
      } else if (response.status === 429) {
        showToast("Rate limit reached. Please wait a moment.");
      } else if (response.status === 413) {
        showToast("Recording too long. Please try a shorter recording.");
      } else if (response.status === 502) {
        showToast("Server error. Please try again.");
      } else {
        showToast("Something went wrong. Please try again.");
      }
    } catch (e) {
      showToast("Network error. Check your connection.");
    } finally {
      setState("idle");
      setTimer(0);
    }
  };

  const isRecording = state === "recording";
  const isProcessing = state === "processing";

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/history")}
          activeOpacity={0.7}
        >
          <Clock size={22} color="#FFFFFF" strokeWidth={1.5} />
          {historyCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {historyCount > 99 ? "99+" : historyCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/settings")}
          activeOpacity={0.7}
        >
          <Settings size={22} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {/* Record Button */}
        <View style={styles.recordButtonContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseAnim }],
                borderColor: "#FF3B30",
              },
            ]}
          />
          <TouchableOpacity
            onPress={handleRecordButton}
            disabled={isProcessing}
            activeOpacity={0.85}
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Mic
                size={36}
                color={isRecording ? "#FF3B30" : "#FFFFFF"}
                strokeWidth={1.5}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* State Label */}
        <View style={styles.stateLabelContainer}>
          {isProcessing ? (
            <Text style={styles.stateLabel}>Processing...</Text>
          ) : isRecording ? (
            <Text style={[styles.stateLabel, styles.recordingLabel]}>
              Recording... {formatTime(timer)}
            </Text>
          ) : (
            <Text style={styles.stateLabel}>Tap to record</Text>
          )}
        </View>
      </View>

      {/* Bottom Notes Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.notesButton}
          onPress={() => router.push("/notes")}
          activeOpacity={0.7}
        >
          <FileText size={22} color="#FFFFFF" strokeWidth={1.5} />
          {notesCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notesCount > 99 ? "99+" : notesCount}
              </Text>
            </View>
          )}
          <Text style={styles.notesLabel}>Notes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconButton: {
    padding: 8,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  recordButtonActive: {
    borderColor: "#FF3B30",
  },
  stateLabelContainer: {
    marginTop: 28,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stateLabel: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "400",
  },
  recordingLabel: {
    color: "#FF3B30",
    fontWeight: "500",
  },
  bottomBar: {
    paddingBottom: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  notesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    position: "relative",
  },
  notesLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
