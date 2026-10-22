import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { TemplateRenderer } from "../../components/templates/TemplateRenderer";
import { useTheme } from "../../contexts/ThemeContext";
import { CountdownEvent, getEventById } from "../../utils/countdownStorage";

export default function CountdownDetail() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<CountdownEvent | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    if (id) getEventById(id).then(setEvent);
  }, [id]);

  if (!event) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      />
    );
  }

  const isPhotoTemplate = ["photo-frame", "photo-blur"].includes(
    event.template || "photo-frame",
  );

  const goToEdit = () => {
    setMenuVisible(false);
    router.push({
      pathname: "/events/countdown",
      params: { id: event.id },
    });
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) return;

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: event.title,
        });
      }
    } catch (err) {
      console.warn("Share failed", err);
    }
  };

  if (isPhotoTemplate) {
    return (
      <View style={styles.fullBleedContainer}>
        <ViewShot
          ref={viewShotRef}
          style={StyleSheet.absoluteFill}
          options={{ format: "png", quality: 1 }}
        >
          <TemplateRenderer
            templateId={event.template || "photo-frame"}
            fullBleed
            data={{
              title: event.title,
              date: event.date,
              photo: event.photo,
              color: event.color,
            }}
          />
        </ViewShot>

        <View style={styles.floatingTopBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.circleBtnLight}
          >
            <Feather name="chevron-left" size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => setMenuVisible((v) => !v)}
            style={styles.circleBtnLight}
          >
            <Feather name="more-horizontal" size={22} color="#fff" />
          </Pressable>
        </View>

        {menuVisible && (
          <>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setMenuVisible(false)}
            />
            <ActionMenu onEdit={goToEdit} onShare={handleShare} />
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.circleBtn}>
          <Feather name="chevron-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={() => setMenuVisible((v) => !v)}
          style={styles.circleBtn}
        >
          <Feather
            name="more-horizontal"
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.cardWrap}>
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
          <TemplateRenderer
            templateId={event.template || "photo-frame"}
            data={{
              title: event.title,
              date: event.date,
              photo: event.photo,
              color: event.color,
            }}
          />
        </ViewShot>
      </View>

      {menuVisible && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuVisible(false)}
          />
          <ActionMenu
            onEdit={goToEdit}
            onShare={handleShare}
            style={{ top: 105 }}
          />
        </>
      )}
    </View>
  );
}

function ActionMenu({
  onEdit,
  onShare,
  style,
}: {
  onEdit: () => void;
  onShare: () => void;
  style?: any;
}) {
  return (
    <View style={[styles.menu, style]}>
      <Pressable onPress={onEdit} style={styles.menuItem}>
        <Feather name="edit-2" size={18} color="#000" />
        <Text style={styles.menuText}>Edit</Text>
      </Pressable>
      <View style={styles.menuDivider} />
      <Pressable onPress={onShare} style={styles.menuItem}>
        <Feather name="share" size={18} color="#000" />
        <Text style={styles.menuText}>Share</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrap: {
    paddingHorizontal: 20,
    marginTop: 20,
  },

  fullBleedContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  floatingTopBar: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleBtnLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  menu: {
    position: "absolute",
    top: 105,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 6,
    minWidth: 160,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    zIndex: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 8,
  },
});
