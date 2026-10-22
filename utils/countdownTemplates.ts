// utils/countdownTemplates.ts

export type TemplateId =
  | "calendar"
  | "photo-frame"
  | "photo-blur"  
  | "bracket-color"
  | "tech-dark"
  | "minimal"
  | "shaped";

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  icon: string;
  customizable: {
    hasColor: boolean;
    hasPhoto: boolean;
  };
  preview: string;
}

// Order here = order shown in the horizontal style picker
export const COUNTDOWN_TEMPLATES: TemplateConfig[] = [
  {
    id: "photo-frame",
    name: "Photo",
    icon: "image-frame",
    customizable: { hasColor: false, hasPhoto: true },
    preview: "Photo card with big day counter",
  },
  {
    id: "bracket-color",
    name: "Frame",
    icon: "crop",
    customizable: { hasColor: true, hasPhoto: false },
    preview: "Viewfinder frame, pick your color",
  },
  {
    id: "tech-dark",
    name: "Tech",
    icon: "tablet-dashboard",
    customizable: { hasColor: true, hasPhoto: false },
    preview: "Dark device-style card",
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: "calendar",
    customizable: { hasColor: true, hasPhoto: false },
    preview: "Calendar grid with highlighted day",
  },
  {
    id: "minimal",
    name: "Minimal",
    icon: "minus",
    customizable: { hasColor: true, hasPhoto: false },
    preview: "Clean & simple",
  },
  {
    id: "shaped",
    name: "Shaped",
    icon: "rectangle-rounded",
    customizable: { hasColor: true, hasPhoto: false },
    preview: "Rounded card design",
  },
  {
  id: "photo-blur",
  name: "Blur",
  icon: "blur",
  customizable: { hasColor: false, hasPhoto: true },
  preview: "Framed photo over a blurred backdrop",
},
];

export const getTemplate = (id: TemplateId) =>
  COUNTDOWN_TEMPLATES.find((t) => t.id === id);

export const TEMPLATE_COLORS = [
  "#F6C6CE", 
  "#3B4A6B",
  "#6FA97C",
  "#3478F6",
  "#FF9F43",
  "#A66DD4",
  "#FF5A3C",
];