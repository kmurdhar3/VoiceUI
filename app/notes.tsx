import React, { useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useNotes } from "@/context/NotesContext";
import { useToast } from "@/components/ToastProvider";

function groupNotesByDate(notes: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const groups: { title: string; data: any[] }[] = [
    { title: "TODAY", data: [] },
    { title: "YESTERDAY", data: [] },
    { title: "LAST WEEK", data: [] },
    { title: "OLDER", data: [] },
  ];

  notes.forEach((note) => {
    const date = new Date(note.created_at);
    const noteDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (noteDay.getTime() === today.getTime()) {
      groups[0].data.push(note);
    } else if (noteDay.getTime() === yesterday.getTime()) {
      groups[1].data.push(note);
    } else if (date >= lastWeekStart) {
      groups[2].data.push(note);
    } else {
      groups[3].data.push(note);
    }
  });

  return groups.filter((g) => g.data.length > 0);
}

function formatNoteDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NoteItem({
  note,
  onDelete,
}: {
  note: any;
  onDelete: (id: string) => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;

  const handleDelete = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDelete(note.id));
  };

  return (
    <Animated.View style={{ opacity }}>
      <View style={styles.noteItem}>
        <View style={styles.noteContent}>
          <Text style={styles.noteText} numberOfLines={3}>
            {note.text}
          </Text>
          <Text style={styles.noteDate}>{formatNoteDate(note.created_at)}</Text>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteButton}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color="#FF3B30" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function NotesScreen() {
  const { notes, deleteNote } = useNotes();
  const { showToast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
    } catch (e) {
      showToast("Failed to delete note.");
    }
  };

  const groups = groupNotesByDate(notes);

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
        <Text style={styles.headerTitle}>Notes</Text>
        <View style={styles.backButton} />
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved notes</Text>
          <Text style={styles.emptySubtext}>
            Save transcriptions from the Results screen
          </Text>
        </View>
      ) : (
        <FlatList
          data={[{ key: "content" }]}
          renderItem={() => (
            <View>
              {groups.map((group, index) => (
                <View key={group.title}>
                  <Text
                    style={[
                      styles.sectionHeader,
                      index === 0 && styles.firstSectionHeader,
                    ]}
                  >
                    {group.title}
                  </Text>
                  {group.data.map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888888",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 8,
  },
  firstSectionHeader: {
    paddingTop: 8,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginBottom: 2,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteContent: {
    flex: 1,
    marginRight: 12,
  },
  noteText: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
    marginBottom: 6,
  },
  noteDate: {
    fontSize: 12,
    color: "#888888",
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
});
