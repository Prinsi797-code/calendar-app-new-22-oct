// app/events/countdownStyle.tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  TEMPLATE_CARD_HEIGHTS,
  TemplateRenderer,
} from "../../components/templates/TemplateRenderer";
import { useTheme } from "../../contexts/ThemeContext";
import { COUNTDOWN_PHOTOS, TYPE_META } from "../../utils/countdownAssets";
import {
  CountdownEvent,
  getEventById,
  saveEvent,
  updateEvent,
} from "../../utils/countdownStorage";
import {
  COUNTDOWN_TEMPLATES,
  TEMPLATE_COLORS,
  TemplateId,
  getTemplate,
} from "../../utils/countdownTemplates";

export default function CountdownStyle() {
  const { colors } = useTheme();
  const router = useRouter();
  const { title, type, date, id } = useLocalSearchParams<{
    title: string;
    type: string;
    date: string;
    id: string;
  }>();

  const [existingEvent, setExistingEvent] = useState<CountdownEvent | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>("photo-frame");
  const [selectedColor, setSelectedColor] = useState(TEMPLATE_COLORS[0]);
  const [selectedPhoto, setSelectedPhoto] = useState("img1");
  const [activeTab, setActiveTab] = useState<"style" | "color" | "photo">(
    "style",
  );

  // IMPORTANT: when editing an existing event we must load ITS saved
  // template/color/photo into state, otherwise the preview keeps
  // showing the hardcoded defaults ("img1" etc.) while the picker
  // strip below still shows the real saved value as "selected" —
  // exactly the mismatch you saw (preview ≠ checked thumbnail).
  useEffect(() => {
    if (!id) return;
    getEventById(id).then((ev) => {
      if (!ev) return;
      setExistingEvent(ev);
      setSelectedTemplate(ev.template || "photo-frame");
      setSelectedColor(ev.color || TEMPLATE_COLORS[0]);
      setSelectedPhoto(ev.photo || "img1");
    });
  }, [id]);

  const displayTitle = title || existingEvent?.title || "";
  const displayDate = date
    ? new Date(date)
    : existingEvent?.date
      ? new Date(existingEvent.date)
      : new Date();

  const template = getTemplate(selectedTemplate);

  const handleSelectTemplate = (tId: TemplateId) => {
    setSelectedTemplate(tId);
    const t = getTemplate(tId);
    if (t?.customizable.hasPhoto) setActiveTab("photo");
    else if (t?.customizable.hasColor) setActiveTab("color");
    else setActiveTab("style");
  };

  const handleSave = async () => {
    // Editing an existing event — update it in place.
    if (existingEvent) {
      await updateEvent({
        ...existingEvent,
        template: selectedTemplate,
        color: template?.customizable.hasColor
          ? selectedColor
          : existingEvent.color,
        photo: template?.customizable.hasPhoto ? selectedPhoto : null,
      });
      router.back();
      return;
    }

    if (!title || !type) return;

    await saveEvent({
      id: Date.now().toString(),
      title,
      type: type as any,
      date: date || new Date().toISOString(),
      ignoreYear: false,
      reminders: [],
      repeat: "none",
      color: template?.customizable.hasColor
        ? selectedColor
        : TYPE_META[type as keyof typeof TYPE_META].color,
      photo: template?.customizable.hasPhoto ? selectedPhoto : null,
      createdAt: Date.now(),
      template: selectedTemplate,
    });

    router.push("/(tabs)/countdown");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Style
        </Text>
        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <Feather name="check" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Live preview — same component that renders the final saved card */}
      <View style={styles.previewContainer}>
        <TemplateRenderer
          templateId={selectedTemplate}
          data={{
            title: displayTitle,
            date: displayDate,
            photo: selectedPhoto,
            color: selectedColor,
          }}
          onCropPress={() => {
            // TODO: hook this up to an actual crop screen/modal
          }}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => setActiveTab("style")}
          style={[styles.tab, activeTab === "style" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "style" ? "#6FA97C" : colors.textSecondary,
              },
            ]}
          >
            Style
          </Text>
        </Pressable>

        {template?.customizable.hasColor && (
          <Pressable
            onPress={() => setActiveTab("color")}
            style={[styles.tab, activeTab === "color" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "color" ? "#6FA97C" : colors.textSecondary,
                },
              ]}
            >
              Color
            </Text>
          </Pressable>
        )}

        {template?.customizable.hasPhoto && (
          <Pressable
            onPress={() => setActiveTab("photo")}
            style={[styles.tab, activeTab === "photo" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "photo" ? "#6FA97C" : colors.textSecondary,
                },
              ]}
            >
              Photo
            </Text>
          </Pressable>
        )}
      </View>

      {/* Strips */}
      {activeTab === "style" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {COUNTDOWN_TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => handleSelectTemplate(t.id)}
              style={[
                styles.templateThumb,
                selectedTemplate === t.id && styles.templateThumbSelected,
              ]}
            >
              <View
                style={styles.templateThumbPreviewWrap}
                pointerEvents="none"
              >
                <View
                  style={[
                    styles.templateThumbScaler,
                    {
                      height: TEMPLATE_CARD_HEIGHTS[t.id],
                      transform: [{ scale: 110 / 250 }],
                    },
                  ]}
                >
                  <TemplateRenderer
                    templateId={t.id}
                    data={{
                      title: displayTitle || "Event",
                      date: displayDate,
                      photo: selectedPhoto,
                      color:
                        t.id === selectedTemplate
                          ? selectedColor
                          : TEMPLATE_COLORS[0],
                    }}
                  />
                </View>
              </View>
              <Text style={styles.templateThumbLabel}>{t.name}</Text>
              {selectedTemplate === t.id && (
                <View style={styles.templateCheck}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}

      {activeTab === "color" && template?.customizable.hasColor && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {TEMPLATE_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setSelectedColor(c)}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                selectedColor === c && styles.colorSwatchSelected,
              ]}
            >
              {selectedColor === c && (
                <Feather name="check" size={16} color="#fff" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}

      {activeTab === "photo" && template?.customizable.hasPhoto && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {COUNTDOWN_PHOTOS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setSelectedPhoto(p.key)}
              style={[
                styles.photoThumb,
                selectedPhoto === p.key && styles.photoThumbSelected,
              ]}
            >
              <Image source={p.source} style={StyleSheet.absoluteFill} />
              {selectedPhoto === p.key && (
                <View style={styles.photoCheck}>
                  <Feather name="check" size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6FA97C",
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tab: { paddingVertical: 12, marginRight: 24 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#6FA97C" },
  tabText: { fontWeight: "600" },

  strip: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  templateThumb: {
    width: 110,
    marginRight: 12,
  },
  templateThumbSelected: {
    borderWidth: 2,
    borderColor: "#6FA97C",
    borderRadius: 14,
  },
  templateThumbPreviewWrap: {
    height: 150,
    width: 110,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee",
  },
  templateThumbScaler: {
    width: 250,
    height: 340,
    transform: [{ scale: 110 / 250 }],
  },
  templateThumbLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },
  templateCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#6FA97C",
    borderRadius: 10,
    padding: 3,
  },

  // color swatches
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#000",
  },

  // photo thumbnails
  photoThumb: {
    width: 90,
    height: 130,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
  },
  photoThumbSelected: {
    borderWidth: 3,
    borderColor: "#6FA97C",
  },
  photoCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#6FA97C",
    borderRadius: 10,
    padding: 4,
  },
});
