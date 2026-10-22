// components/templates/TemplateSelector.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COUNTDOWN_TEMPLATES } from "../../utils/countdownTemplates";

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onSelectTemplate: (templateId: string) => void;
  colors: any;
}

export function TemplateSelector({
  selectedTemplate = "calendar",
  onSelectTemplate,
  colors,
}: TemplateSelectorProps) {
  const [filterType, setFilterType] = useState<"all" | "photo" | "color">(
    "all",
  );

  const filteredTemplates =
    filterType === "all"
      ? COUNTDOWN_TEMPLATES
      : filterType === "photo"
        ? COUNTDOWN_TEMPLATES.filter((t) => t.customizable.hasPhoto)
        : COUNTDOWN_TEMPLATES.filter((t) => t.customizable.hasColor);

  return (
    <View style={{ flex: 1 }}>
      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        <Pressable
          onPress={() => setFilterType("all")}
          style={[
            styles.filterTab,
            filterType === "all" && styles.filterTabActive,
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              filterType === "all" && styles.filterTabTextActive,
            ]}
          >
            All Templates
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilterType("photo")}
          style={[
            styles.filterTab,
            filterType === "photo" && styles.filterTabActive,
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              filterType === "photo" && styles.filterTabTextActive,
            ]}
          >
            With Photo
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilterType("color")}
          style={[
            styles.filterTab,
            filterType === "color" && styles.filterTabActive,
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              filterType === "color" && styles.filterTabTextActive,
            ]}
          >
            Colorful
          </Text>
        </Pressable>
      </View>

      {/* Template grid */}
      <FlatList
        data={filteredTemplates}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContainer}
        scrollEnabled={true}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectTemplate(item.id)}
            style={[
              styles.templateCard,
              selectedTemplate === item.id && styles.templateCardSelected,
            ]}
          >
            {/* Template preview box */}
            <View
              style={[styles.templatePreview, { backgroundColor: "#4A90E2" }]}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={36}
                color="#FFF"
              />
              <Text style={styles.daysPreview}>2</Text>
            </View>

            {/* Template name */}
            <Text style={styles.templateName}>{item.name}</Text>

            {/* Features badges */}
            <View style={styles.featureBadges}>
              {item.customizable.hasPhoto && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>📷</Text>
                </View>
              )}
              {item.customizable.hasColor && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🎨</Text>
                </View>
              )}
            </View>

            {/* Selected indicator */}
            {selectedTemplate === item.id && (
              <View style={styles.selectedIndicator}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color="#6FA97C"
                />
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

// =====================
// DETAILED TEMPLATE PICKER
// =====================
interface DetailedTemplatePickerProps {
  templateId: string;
  onSelectTemplate: (templateId: string) => void;
  colors: any;
}

export function DetailedTemplatePicker({
  templateId,
  onSelectTemplate,
  colors,
}: DetailedTemplatePickerProps) {
  return (
    <View style={{ paddingHorizontal: 12 }}>
      <View style={styles.detailedHeader}>
        <Text style={styles.detailedTitle}>Choose Your Style</Text>
        <Text style={styles.detailedSubtitle}>
          Different designs for your countdown
        </Text>
      </View>

      <FlatList
        data={COUNTDOWN_TEMPLATES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectTemplate(item.id)}
            style={[
              styles.detailedCard,
              templateId === item.id && styles.detailedCardSelected,
            ]}
          >
            {/* Preview */}
            <View
              style={[styles.detailedPreview, { backgroundColor: "#4A90E2" }]}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={48}
                color="#FFF"
                opacity={0.8}
              />
              <Text style={styles.daysDetailed}>2</Text>
            </View>

            {/* Name */}
            <Text style={styles.detailedName}>{item.name}</Text>

            {/* Description */}
            <Text style={styles.detailedDesc}>{item.preview}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Filter tabs
  filterTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  filterTabActive: {
    backgroundColor: "#6FA97C",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  filterTabTextActive: {
    color: "#FFF",
  },

  // Grid
  gridContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  templateCard: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  templateCardSelected: {
    borderWidth: 2,
    borderColor: "#6FA97C",
    borderRadius: 16,
  },
  templatePreview: {
    height: 140,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  daysPreview: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 4,
  },
  templateName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 6,
  },
  featureBadges: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 4,
  },

  // Detailed
  detailedHeader: {
    marginBottom: 16,
  },
  detailedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  detailedSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  horizontalList: {
    gap: 12,
    paddingVertical: 8,
  },
  detailedCard: {
    width: 140,
    paddingHorizontal: 0,
  },
  detailedCardSelected: {
    borderWidth: 2,
    borderColor: "#6FA97C",
    borderRadius: 16,
    padding: 2,
  },
  detailedPreview: {
    height: 120,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  daysDetailed: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 2,
  },
  detailedName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  detailedDesc: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    lineHeight: 12,
  },
});
