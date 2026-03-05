import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Copy, Share2, Bookmark, Check } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";
import { useNotes } from "@/context/NotesContext";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "";

interface ResultsData {
  original?: string;
  professional?: string;
  casual?: string;
  concise?: string;
}

interface CardProps {
  label: string;
  text: string;
  onCopy: () => Promise<void>;
  onShare: () => Promise<void>;
  onSave: () => Promise<void>;
  copyDone: boolean;
  saveDone: boolean;
}

function ResultCard({
  label,
  text,
  onCopy,
  onShare,
  onSave,
  copyDone,
  saveDone,
}: CardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardText}>{text}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCopy}
          activeOpacity={0.7}
        >
          {copyDone ? (
            <Check size={16} color="#34C759" strokeWidth={2} />
          ) : (
            <Copy size={16} color="#888888" strokeWidth={1.5} />
          )}
          <Text style={[styles.actionText, copyDone && styles.doneText]}>
            {copyDone ? "Copied" : "Copy"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onShare}
          activeOpacity={0.7}
        >
          <Share2 size={16} color="#888888" strokeWidth={1.5} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onSave}
          activeOpacity={0.7}
        >
          {saveDone ? (
            <Check size={16} color="#34C759" strokeWidth={2} />
          ) : (
            <Bookmark size={16} color="#888888" strokeWidth={1.5} />
          )}
          <Text style={[styles.actionText, saveDone && styles.doneText]}>
            {saveDone ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const { data: dataParam } = useLocalSearchParams<{ data: string }>();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { refreshNotes } = useNotes();

  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});
  const [saveStates, setSaveStates] = useState<Record<string, boolean>>({});

  let resultsData: ResultsData = {};
  try {
    if (dataParam) {
      resultsData = JSON.parse(dataParam);
    }
  } catch (e) {
    resultsData = {
      original: "Sample original transcription text.",
      professional:
        "This is a professionally rewritten version of the transcription.",
      casual: "Here's a casual take on what you said.",
      concise: "Brief summary of the transcription.",
    };
  }

  // Demo fallback data for when no real data is available
  if (!resultsData.original && !resultsData.professional) {
    resultsData = {
      original:
        "Hey so I was thinking about the project deadline and like we probably need to move it because nobody's finished their parts yet and I think we should talk about it in the next meeting",
      professional:
        "I wanted to address the upcoming project deadline. Given that team members have not yet completed their respective deliverables, I recommend we discuss a timeline adjustment in our next meeting.",
      casual:
        "Hey, so the project deadline might need to move since no one's done yet. Let's chat about it next meeting.",
      concise: "Project deadline needs adjustment. Discuss in next meeting.",
    };
  }

  const handleCopy = async (key: string, text: string) => {
    await Clipboard.setStringAsync(text);
    setCopyStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleShare = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch (e) {
      showToast("Could not open share sheet");
    }
  };

  const handleSave = async (key: string, text: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, type: key }),
      });

      if (response.ok) {
        setSaveStates((prev) => ({ ...prev, [key]: true }));
        await refreshNotes();
        setTimeout(() => {
          setSaveStates((prev) => ({ ...prev, [key]: false }));
        }, 2000);
      } else {
        showToast("Failed to save note. Please try again.");
      }
    } catch (e) {
      showToast("Network error. Could not save note.");
    }
  };

  const cards = [
    { key: "original", label: "ORIGINAL", text: resultsData.original },
    { key: "professional", label: "PROFESSIONAL", text: resultsData.professional },
    { key: "casual", label: "CASUAL", text: resultsData.casual },
    { key: "concise", label: "CONCISE", text: resultsData.concise },
  ].filter((c) => c.text);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cards.map((card) => (
          <ResultCard
            key={card.key}
            label={card.label}
            text={card.text!}
            onCopy={() => handleCopy(card.key, card.text!)}
            onShare={() => handleShare(card.text!)}
            onSave={() => handleSave(card.key, card.text!)}
            copyDone={copyStates[card.key] || false}
            saveDone={saveStates[card.key] || false}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888888",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    color: "#888888",
    fontWeight: "500",
  },
  doneText: {
    color: "#34C759",
  },
});
