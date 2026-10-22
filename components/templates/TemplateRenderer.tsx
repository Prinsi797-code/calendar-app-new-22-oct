// components/templates/TemplateRenderer.tsx

import React from "react";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import { getPhotoSource } from "../../utils/countdownAssets";
import { TemplateId } from "../../utils/countdownTemplates";

export interface TemplatePreviewData {
  title: string;
  date: string | Date | null;
  photo?: string | null;
  color?: string;
}

interface Props {
  data: TemplatePreviewData;
  templateId: TemplateId;
  onCropPress?: () => void;
  fullBleed?: boolean;
}

function daysLeftFor(date: string | Date | null): number {
  if (!date) return 0;
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function formattedDate(date: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =====================================================================
// 1. PHOTO FRAME TEMPLATE  (matches the hourglass/calendar photo card)
// =====================================================================
export function PhotoFrameTemplate({ data, onCropPress, fullBleed }: Props) {
  const days = daysLeftFor(data.date);
  const source = getPhotoSource(data.photo) ?? getPhotoSource("img1");

  if (fullBleed) {
    return (
      <View style={styles.pfFullBleedCard}>
        {source && (
          <ImageBackground
            source={source}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          >
            {/* darken the bottom so white text stays legible on any photo */}
            <View style={styles.pfFullBleedScrim} />
            <View style={styles.pfFullBleedTextWrap}>
              <Text style={styles.pfFullBleedTitle} numberOfLines={1}>
                {data.title || "Untitled"}
              </Text>
              <View style={styles.pfDaysWrap}>
                <Text style={styles.pfDaysNumber}>{days}</Text>
                <Text style={styles.pfDaysUnit}>D</Text>
              </View>
              <Text style={styles.pfFullBleedDate}>
                Days until {formattedDate(data.date)}
              </Text>
            </View>
          </ImageBackground>
        )}
      </View>
    );
  }

  // CARD (default): used in the style-picker preview/thumbnails where a
  // contained, rounded card makes more sense while editing.
  return (
    <View style={styles.pfCard}>
      <View style={styles.pfPhotoWrap}>
        {source && (
          <ImageBackground source={source} style={styles.pfPhoto}>
            {onCropPress && (
              <View style={styles.pfCropBadge} onTouchEnd={onCropPress}>
                <Text style={styles.pfCropText}>Crop</Text>
              </View>
            )}
            <View style={styles.pfDaysWrap}>
              <Text style={styles.pfDaysNumber}>{days}</Text>
              <Text style={styles.pfDaysUnit}>D</Text>
            </View>
          </ImageBackground>
        )}
      </View>
      <View style={styles.pfFooter}>
        <Text style={styles.pfTitle} numberOfLines={1}>
          {data.title || "Untitled"}
        </Text>
        <Text style={styles.pfDate}>Days until {formattedDate(data.date)}</Text>
      </View>
    </View>
  );
}

// =====================================================================
// 2. BRACKET / COLOR TEMPLATE  (viewfinder frame + swatch strip footer)
// =====================================================================
export function BracketColorTemplate({ data }: Props) {
  const days = daysLeftFor(data.date);
  const bg = data.color || "#F6C6CE";

  return (
    <View style={[styles.brCard, { backgroundColor: bg }]}>
      <View style={styles.brInner}>
        {/* corner brackets */}
        <View style={[styles.brCorner, styles.brCornerTL]} />
        <View style={[styles.brCorner, styles.brCornerTR]} />
        <View style={[styles.brCorner, styles.brCornerBL]} />
        <View style={[styles.brCorner, styles.brCornerBR]} />

        <Text style={styles.brSubtitle}>
          Days until {formattedDate(data.date)}
        </Text>
        <Text style={styles.brNumber}>{days}</Text>
      </View>

      <Text style={styles.brTitle} numberOfLines={1}>
        {data.title || "Untitled"}
      </Text>

      <View style={styles.brFooterRow}>
        <View style={styles.brSwatchStrip}>
          {["#3478F6", "#FF2D78", "#FF9F43", "#6FA97C", "#A66DD4"].map(
            (c, i) => (
              <View key={i} style={[styles.brSwatch, { backgroundColor: c }]} />
            ),
          )}
        </View>
        <View style={styles.brIconRow}>
          <View style={styles.brIconDot} />
          <View style={styles.brIconPlus} />
          <View style={styles.brIconGrid} />
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// 3. TECH / DARK TEMPLATE  (device-style header bar + dark body)
// =====================================================================
export function TechDarkTemplate({ data }: Props) {
  const days = daysLeftFor(data.date);
  const bg = data.color || "#3B4A6B";

  return (
    <View style={[styles.tdCard, { backgroundColor: bg }]}>
      <View style={styles.tdHeaderBar}>
        <View style={styles.tdDotsGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={styles.tdDot} />
          ))}
        </View>
        <View style={styles.tdToggle}>
          <View style={styles.tdToggleCircleFilled} />
          <View style={styles.tdToggleCircleOutline} />
        </View>
      </View>

      <View style={styles.tdBody}>
        <View style={styles.tdAccentSquare} />
        <Text style={styles.tdTitle} numberOfLines={1}>
          {data.title || "Untitled"}
        </Text>
        <View style={styles.tdNumberRow}>
          <Text style={styles.tdNumber}>{days}</Text>
          <Text style={styles.tdUnit}>D</Text>
        </View>
        <Text style={styles.tdDate}>Days until {formattedDate(data.date)}</Text>
      </View>
    </View>
  );
}

// =====================================================================
// 4. CALENDAR TEMPLATE  (bug fixed: grid rows now get explicit width)
// =====================================================================
export function CalendarTemplate({ data }: Props) {
  const days = daysLeftFor(data.date);
  const accent = data.color || "#3478F6";
  const eventDate = data.date
    ? typeof data.date === "string"
      ? new Date(data.date)
      : data.date
    : new Date();

  const daysInMonth = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    1,
  ).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <View style={styles.calCard}>
      <Text style={styles.calMonth}>
        {eventDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
      </Text>

      <View style={styles.calWeekRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <Text key={i} style={styles.calWeekLabel}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.calGrid}>
        {cells.map((day, idx) => (
          <View key={idx} style={styles.calCell}>
            {day !== null && (
              <View
                style={[
                  styles.calDateCircle,
                  day === eventDate.getDate() && {
                    backgroundColor: accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.calDateText,
                    day === eventDate.getDate() && { color: "#fff" },
                  ]}
                >
                  {day}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <Text style={[styles.calDays, { color: accent }]}>{days}D</Text>
      <Text style={styles.calTitle} numberOfLines={1}>
        {data.title || "Untitled"}
      </Text>
    </View>
  );
}

// =====================================================================
// 5 & 6. Simple extra styles kept for variety
// =====================================================================
export function MinimalTemplate({ data }: Props) {
  const days = daysLeftFor(data.date);
  const accent = data.color || "#6FA97C";
  return (
    <View style={[styles.minCard, { borderColor: accent }]}>
      <Text style={[styles.minLabel, { color: accent }]}>Days until</Text>
      <Text style={[styles.minNumber, { color: accent }]}>{days}</Text>
      <Text style={[styles.minTitle, { color: accent }]} numberOfLines={1}>
        {data.title || "Untitled"}
      </Text>
    </View>
  );
}

export function PhotoBlurTemplate({ data, fullBleed }: Props) {
  const days = daysLeftFor(data.date);
  const source = getPhotoSource(data.photo) ?? getPhotoSource("img1");

  return (
    <View style={[styles.pbCard, fullBleed && styles.pbCardFullBleed]}>
      {source && (
        <>
          {/* Blurred, zoomed-in background — fills the whole card */}
          <ImageBackground
            source={source}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={25}
          >
            <View style={styles.pbScrim} />
          </ImageBackground>

          {/* Sharp framed photo, centered on top */}
          <View
            style={[
              styles.pbFrameWrap,
              fullBleed && styles.pbFrameWrapFullBleed,
            ]}
          >
            <Image
              source={source}
              style={styles.pbFrameImage}
              resizeMode="cover"
            />
          </View>
        </>
      )}

      <View
        style={[styles.pbTextWrap, fullBleed && styles.pbTextWrapFullBleed]}
      >
        <View style={styles.pfDaysWrap}>
          <Text style={styles.pfDaysNumber}>{days}</Text>
          <Text style={styles.pfDaysUnit}>D</Text>
        </View>
        <Text style={styles.pbTitle} numberOfLines={1}>
          {data.title || "Untitled"}
        </Text>
        <Text style={styles.pbDate}>Days until {formattedDate(data.date)}</Text>
      </View>
    </View>
  );
}

export function ShapedTemplate({ data }: Props) {
  const days = daysLeftFor(data.date);
  const accent = data.color || "#FF9F43";
  return (
    <View style={[styles.shCard, { backgroundColor: accent }]}>
      <Text style={styles.shNumber}>{days}</Text>
      <Text style={styles.shTitle} numberOfLines={1}>
        {data.title || "Untitled"}
      </Text>
    </View>
  );
}

// =====================================================================
// MAIN RENDERER
// =====================================================================
export function TemplateRenderer({
  data,
  templateId,
  onCropPress,
  fullBleed,
}: Props) {
  switch (templateId) {
    case "photo-frame":
      return (
        <PhotoFrameTemplate
          data={data}
          onCropPress={onCropPress}
          fullBleed={fullBleed}
        />
      );
    case "bracket-color":
      return <BracketColorTemplate data={data} />;
    case "tech-dark":
      return <TechDarkTemplate data={data} />;
    case "calendar":
      return <CalendarTemplate data={data} />;
    case "minimal":
      return <MinimalTemplate data={data} />;
    case "shaped":
      return <ShapedTemplate data={data} />;
    case "photo-blur":
      return <PhotoBlurTemplate data={data} fullBleed={fullBleed} />;
    default:
      return <PhotoFrameTemplate data={data} onCropPress={onCropPress} />;
  }
}

// =====================================================================
// STYLES — box height/width kept identical (300) across every template
// so switching templates never jumps the layout, only color/content.
// =====================================================================
const CARD_HEIGHT = 340;
const CALENDAR_CARD_HEIGHT = 410; // ✅ calendar needs more room than other templates
const PHOTO_CARD_HEIGHT = 480;

export const TEMPLATE_CARD_HEIGHTS: Record<TemplateId, number> = {
  "photo-frame": PHOTO_CARD_HEIGHT,
  "photo-blur": CARD_HEIGHT,
  "bracket-color": CARD_HEIGHT,
  "tech-dark": CARD_HEIGHT,
  calendar: CALENDAR_CARD_HEIGHT, // ✅ updated
  minimal: CARD_HEIGHT,
  shaped: CARD_HEIGHT,
};

const styles = StyleSheet.create({
  pfCard: {
    height: PHOTO_CARD_HEIGHT,
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  pfPhotoWrap: { flex: 1 },
  pfPhoto: { flex: 1, justifyContent: "flex-end" },
  pfCropBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pfCropText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  pfDaysWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
  },
  pfDaysNumber: { color: "#fff", fontSize: 56, fontWeight: "800" },
  pfDaysUnit: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 2,
  },
  pfFooter: { padding: 16 },
  pfTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
  pfDate: { fontSize: 13, color: "#888", marginTop: 4 },
  pfFullBleedCard: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
  },
  pfFullBleedScrim: {
    ...StyleSheet.absoluteFillObject,
    top: "70%",
    // backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  pfFullBleedTextWrap: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 60,
  },
  pfFullBleedTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  pfFullBleedDate: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 12,
  },
  pbCard: {
    height: CARD_HEIGHT,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  pbCardFullBleed: {
    flex: 1,
    height: undefined,
    width: "100%",
    borderRadius: 0,
  },
  pbScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  pbFrameWrap: {
    width: "70%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: 16,
  },
  pbFrameWrapFullBleed: {
    width: "80%",
    marginBottom: 40,
  },
  pbFrameImage: { width: "100%", height: "100%" },
  pbTextWrap: {
    alignItems: "center",
  },
  pbTextWrapFullBleed: {
    position: "absolute",
    bottom: 60,
    left: 24,
    right: 24,
  },
  pbTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: -4,
  },
  pbDate: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
  },
  brCard: {
    height: CARD_HEIGHT,
    width: "100%",
    borderRadius: 24,
    padding: 20,
    justifyContent: "space-between",
  },
  brInner: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  brCorner: {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: "#000",
  },
  brCornerTL: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3 },
  brCornerTR: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3 },
  brCornerBL: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  brCornerBR: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  brSubtitle: { fontSize: 13, color: "#555", marginBottom: 8 },
  brNumber: { fontSize: 64, fontWeight: "800", color: "#000" },
  brTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginVertical: 12,
  },
  brFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brSwatchStrip: { flexDirection: "row" },
  brSwatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 4,
  },
  brIconRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  brIconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#000",
  },
  brIconPlus: { width: 14, height: 14, backgroundColor: "#000" },
  brIconGrid: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 3,
  },
  tdCard: {
    height: CARD_HEIGHT,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
  },
  tdHeaderBar: {
    backgroundColor: "#F0EEDD",
    height: 90,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  tdDotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 60,
  },
  tdDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#999",
    margin: 3,
  },
  tdToggle: { flexDirection: "row", alignItems: "center" },
  tdToggleCircleFilled: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#333",
  },
  tdToggleCircleOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    marginLeft: -6,
    backgroundColor: "#F0EEDD",
  },
  tdBody: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  tdAccentSquare: {
    position: "absolute",
    top: 30,
    right: 24,
    width: 130,
    height: 130,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
  },
  tdTitle: { color: "#F0EEDD", fontSize: 16, fontWeight: "600" },
  tdNumberRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 8 },
  tdNumber: { color: "#F0EEDD", fontSize: 56, fontWeight: "800" },
  tdUnit: {
    color: "#F0EEDD",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 2,
  },
  tdDate: { color: "rgba(240,238,221,0.8)", fontSize: 13, marginTop: 8 },
  calCard: {
    height: CALENDAR_CARD_HEIGHT,
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
  },
  calMonth: { fontWeight: "700", fontSize: 16, marginBottom: 12 },
  calWeekRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 8,
  },
  calWeekLabel: { flex: 1, textAlign: "center", fontWeight: "600" },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  calCell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 4,
  },
  calDateCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  calDateText: { fontWeight: "600", fontSize: 13, color: "#000" },
  calDays: { fontSize: 26, fontWeight: "800", marginTop: 14 },
  calTitle: { fontSize: 13, marginTop: 4, color: "#333" },
  minCard: {
    height: CARD_HEIGHT,
    width: "100%",
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  minLabel: { fontSize: 14 },
  minNumber: { fontSize: 56, fontWeight: "800", marginTop: 10 },
  minTitle: { fontSize: 13, marginTop: 10 },
  shCard: {
    height: CARD_HEIGHT,
    width: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  shNumber: { color: "#fff", fontSize: 60, fontWeight: "800" },
  shTitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 10 },
});
