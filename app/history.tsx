import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { useHistory } from "@/context/HistoryContext";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "https://speakit-api-78524125987.asia-southeast1.run.app";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function groupByDate(items: any[]) {
  // Deduplicate by id first
  const seen = new Set();
  items = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
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

  items.forEach((item) => {
    const date = new Date(item.created_at);
    const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (itemDay.getTime() === today.getTime()) {
      groups[0].data.push(item);
    } else if (itemDay.getTime() === yesterday.getTime()) {
      groups[1].data.push(item);
    } else if (date >= lastWeekStart) {
      groups[2].data.push(item);
    } else {
      groups[3].data.push(item);
    }
  });

  return groups.filter((g) => g.data.length > 0);
}

export default function HistoryScreen() {
  const { items, isLoading, hasNext, loadMore, refresh } = useHistory();

  // Refresh every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );
  const { showToast } = useToast();
  const { token } = useAuth();

  const handleItemPress = async (item: any) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/recordings/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        router.push({
          pathname: "/results",
          params: { data: JSON.stringify(data), _t: Date.now().toString() },
        });
      } else {
        showToast("Could not load recording.");
      }
    } catch (e) {
      showToast("Network error.");
    }
  };

  const handleScroll = useCallback(
    ({ nativeEvent }: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const isNearBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
      if (isNearBottom && hasNext && !isLoading) {
        loadMore();
      }
    },
    [hasNext, isLoading, loadMore]
  );

  const groups = groupByDate(items);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemContent}>
        <Text style={styles.listItemText} numberOfLines={1}>
          {item.raw_transcript
            ? item.raw_transcript.length > 50
              ? item.raw_transcript.substring(0, 50) + "..."
              : item.raw_transcript
            : "Recording"}
        </Text>
        <Text style={styles.listItemSubtext}>
          {formatDuration(Math.round(item.duration_seconds || 0))}
        </Text>
      </View>
      <ChevronRight size={16} color="#888888" strokeWidth={1.5} />
    </TouchableOpacity>
  );

  const renderGroup = (group: { title: string; data: any[] }, index: number) => (
    <View key={group.title}>
      <Text style={[styles.sectionHeader, index === 0 && styles.firstSectionHeader]}>
        {group.title}
      </Text>
      {group.data.map((item) => (
        <View key={`${group.title}-${item.id}`}>{renderItem({ item })}</View>
      ))}
    </View>
  );

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
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={[{ key: "content" }]}
        renderItem={() => (
          <View>
            {groups.length === 0 && !isLoading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recordings yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap the microphone to start recording
                </Text>
              </View>
            ) : (
              groups.map((group, index) => renderGroup(group, index))
            )}
            {isLoading && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#888888" />
              </View>
            )}
          </View>
        )}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.key}
      />
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
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginBottom: 2,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listItemContent: {
    flex: 1,
  },
  listItemText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "400",
    marginBottom: 4,
  },
  listItemSubtext: {
    fontSize: 13,
    color: "#888888",
  },
  loadingMore: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
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