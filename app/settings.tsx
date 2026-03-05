import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ChevronDown, Check } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";

const API_BASE = "https://speakit-api-78524125987.asia-southeast1.run.app";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "hi", label: "Hindi" },
];

const MAX_PROMPT_LENGTH = 200;

export default function SettingsScreen() {
  const [language, setLanguage] = useState("en");
  const [showLangModal, setShowLangModal] = useState(false);
  const [professionalPrompt, setProfessionalPrompt] = useState("");
  const [casualPrompt, setCasualPrompt] = useState("");
  const [concisePrompt, setConcisePrompt] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { token } = useAuth();
  const { showToast } = useToast();

  const originalValues = useRef({ professionalPrompt: "", casualPrompt: "", concisePrompt: "" });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const lang = data.language || "en";
        const profPrompt = data.prompts?.professional || "";
        const casPrompt = data.prompts?.casual || "";
        const conPrompt = data.prompts?.concise || "";
        setLanguage(lang);
        setProfessionalPrompt(profPrompt);
        setCasualPrompt(casPrompt);
        setConcisePrompt(conPrompt);
        originalValues.current = {
          professionalPrompt: profPrompt,
          casualPrompt: casPrompt,
          concisePrompt: conPrompt,
        };
      }
    } catch (e) {
      // Use defaults
    }
  };

  const checkDirty = (field: string, value: string) => {
    const vals = { ...originalValues.current };
    if (field === "professional") vals.professionalPrompt = value;
    if (field === "casual") vals.casualPrompt = value;
    if (field === "concise") vals.concisePrompt = value;

    const changed =
      vals.professionalPrompt !== originalValues.current.professionalPrompt ||
      vals.casualPrompt !== originalValues.current.casualPrompt ||
      vals.concisePrompt !== originalValues.current.concisePrompt;
    setIsDirty(changed);
  };

  const handleLanguageChange = async (code: string) => {
    setLanguage(code);
    setShowLangModal(false);
    try {
      await fetch(`${API_BASE}/api/v1/settings/language`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: code }),
      });
    } catch (e) {
      showToast("Failed to update language.");
    }
  };

  const handleSavePrompts = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings/prompts`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professional: professionalPrompt,
          casual: casualPrompt,
          concise: concisePrompt,
        }),
      });

      if (response.ok) {
        originalValues.current = { professionalPrompt, casualPrompt, concisePrompt };
        setIsDirty(false);
        showToast("Prompts saved successfully.");
      } else {
        showToast("Failed to save prompts.");
      }
    } catch (e) {
      showToast("Network error. Could not save prompts.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === language);

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <TouchableOpacity
            style={styles.languageRow}
            onPress={() => setShowLangModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.languageText}>
              {selectedLang?.label || "English"}
            </Text>
            <ChevronDown size={18} color="#888888" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Prompts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Prompts</Text>
          <Text style={styles.sectionSubtitle}>
            Customize how each style rewrites your transcription
          </Text>

          <View style={styles.promptGroup}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptLabel}>Professional</Text>
              <Text style={styles.charCounter}>
                {professionalPrompt.length}/{MAX_PROMPT_LENGTH}
              </Text>
            </View>
            <TextInput
              style={styles.promptInput}
              value={professionalPrompt}
              onChangeText={(text) => {
                if (text.length <= MAX_PROMPT_LENGTH) {
                  setProfessionalPrompt(text);
                  checkDirty("professional", text);
                }
              }}
              placeholder="e.g. Rewrite in formal business language..."
              placeholderTextColor="#555555"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              selectionColor="#FFFFFF"
            />
          </View>

          <View style={styles.promptGroup}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptLabel}>Casual</Text>
              <Text style={styles.charCounter}>
                {casualPrompt.length}/{MAX_PROMPT_LENGTH}
              </Text>
            </View>
            <TextInput
              style={styles.promptInput}
              value={casualPrompt}
              onChangeText={(text) => {
                if (text.length <= MAX_PROMPT_LENGTH) {
                  setCasualPrompt(text);
                  checkDirty("casual", text);
                }
              }}
              placeholder="e.g. Rewrite in a friendly, conversational tone..."
              placeholderTextColor="#555555"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              selectionColor="#FFFFFF"
            />
          </View>

          <View style={styles.promptGroup}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptLabel}>Concise</Text>
              <Text style={styles.charCounter}>
                {concisePrompt.length}/{MAX_PROMPT_LENGTH}
              </Text>
            </View>
            <TextInput
              style={styles.promptInput}
              value={concisePrompt}
              onChangeText={(text) => {
                if (text.length <= MAX_PROMPT_LENGTH) {
                  setConcisePrompt(text);
                  checkDirty("concise", text);
                }
              }}
              placeholder="e.g. Summarize as briefly as possible..."
              placeholderTextColor="#555555"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              selectionColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      {isDirty && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSavePrompts}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save Prompts"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Language Modal */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLangModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Language</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.langOption}
                onPress={() => handleLanguageChange(item.code)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    item.code === language && styles.langOptionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {item.code === language && (
                  <Check size={18} color="#FFFFFF" strokeWidth={2} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
    paddingBottom: 120,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: -8,
    marginBottom: 4,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  languageText: {
    fontSize: 15,
    color: "#FFFFFF",
  },
  promptGroup: {
    gap: 8,
  },
  promptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promptLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  charCounter: {
    fontSize: 12,
    color: "#888888",
  },
  promptInput: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#FFFFFF",
    minHeight: 80,
    lineHeight: 20,
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContainer: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "60%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  langOptionText: {
    fontSize: 15,
    color: "#888888",
  },
  langOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
