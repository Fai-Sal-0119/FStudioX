// ─── Design Editor Types ──────────────────────────────────────────────────────

export type ToolType =
  | "select"
  | "rect"
  | "circle"
  | "line"
  | "text"
  | "triangle"
  | "star"
  | "hexagon"
  | "arrow";

export type CanvasSizePreset =
  | "instagram-post"
  | "instagram-story"
  | "linkedin-banner"
  | "twitter-header"
  | "youtube-thumb"
  | "custom";

export interface CanvasShape {
  id: string;
  type:
    | "rect"
    | "circle"
    | "line"
    | "text"
    | "triangle"
    | "star"
    | "hexagon"
    | "arrow";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface DesignEditorState {
  shapes: CanvasShape[];
  selectedId: string | null;
  bgColor: string;
  sizePreset: CanvasSizePreset;
  canvasW: number;
  canvasH: number;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
}

export const FONTS = [
  "Inter",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
  "Palatino",
];

export const SIZE_PRESETS: Record<
  CanvasSizePreset,
  { w: number; h: number; label: string }
> = {
  "instagram-post": { w: 1080, h: 1080, label: "Instagram Post (1:1)" },
  "instagram-story": { w: 1080, h: 1920, label: "Instagram Story (9:16)" },
  "linkedin-banner": { w: 1200, h: 627, label: "LinkedIn Banner" },
  "twitter-header": { w: 1500, h: 500, label: "Twitter/X Header" },
  "youtube-thumb": { w: 1280, h: 720, label: "YouTube Thumbnail" },
  custom: { w: 800, h: 600, label: "Custom" },
};

export const GRID_SIZE = 40;

const SHAPE_COUNTER: Record<string, number> = {};

export function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function shapeName(type: string): string {
  SHAPE_COUNTER[type] = (SHAPE_COUNTER[type] ?? 0) + 1;
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return `${label} ${SHAPE_COUNTER[type]}`;
}

export const DEFAULT_SHAPES: CanvasShape[] = [
  {
    id: generateId(),
    type: "rect",
    name: "Background",
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    rotation: 0,
    fill: "#191B24",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    visible: true,
    locked: true,
  },
  {
    id: generateId(),
    type: "rect",
    name: "Red Block",
    x: 80,
    y: 70,
    width: 220,
    height: 130,
    rotation: 0,
    fill: "#E11D2E",
    stroke: "#FFFFFF",
    strokeWidth: 0,
    opacity: 1,
    visible: true,
    locked: false,
  },
  {
    id: generateId(),
    type: "circle",
    name: "Accent Circle",
    x: 380,
    y: 100,
    width: 140,
    height: 140,
    rotation: 0,
    fill: "#1f2230",
    stroke: "#E11D2E",
    strokeWidth: 3,
    opacity: 1,
    visible: true,
    locked: false,
  },
  {
    id: generateId(),
    type: "text",
    name: "Headline",
    x: 80,
    y: 250,
    width: 440,
    height: 40,
    rotation: 0,
    fill: "transparent",
    stroke: "#FFFFFF",
    strokeWidth: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: "FStudioX Design Canvas",
    fontSize: 28,
    fontFamily: "Inter",
    bold: true,
    italic: false,
  },
];

// ── Template presets ──────────────────────────────────────────────────────────

export type TemplateName =
  | "blank"
  | "social-post"
  | "story"
  | "banner"
  | "poster";

export interface Template {
  name: string;
  shapes: Omit<CanvasShape, "id">[];
  bg: string;
  w: number;
  h: number;
}

export const TEMPLATES: Record<TemplateName, Template> = {
  blank: {
    name: "Blank",
    shapes: [],
    bg: "#191B24",
    w: 800,
    h: 600,
  },
  "social-post": {
    name: "Social Post",
    bg: "#0b0b0f",
    w: 1080,
    h: 1080,
    shapes: [
      {
        type: "rect",
        name: "BG Gradient",
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        rotation: 0,
        fill: "#14151c",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: true,
      },
      {
        type: "rect",
        name: "Red Accent",
        x: 0,
        y: 0,
        width: 1080,
        height: 6,
        rotation: 0,
        fill: "#E11D2E",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
      },
      {
        type: "text",
        name: "Title",
        x: 120,
        y: 440,
        width: 840,
        height: 80,
        rotation: 0,
        fill: "transparent",
        stroke: "#FFFFFF",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "Your Title Here",
        fontSize: 72,
        fontFamily: "Inter",
        bold: true,
        italic: false,
      },
      {
        type: "text",
        name: "Subtitle",
        x: 120,
        y: 560,
        width: 840,
        height: 40,
        rotation: 0,
        fill: "transparent",
        stroke: "#8b93a7",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "Add your message here",
        fontSize: 36,
        fontFamily: "Inter",
        bold: false,
        italic: false,
      },
    ],
  },
  story: {
    name: "Story",
    bg: "#0b0b0f",
    w: 1080,
    h: 1920,
    shapes: [
      {
        type: "rect",
        name: "BG",
        x: 0,
        y: 0,
        width: 1080,
        height: 1920,
        rotation: 0,
        fill: "#14151c",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: true,
      },
      {
        type: "star",
        name: "Star Deco",
        x: 440,
        y: 200,
        width: 200,
        height: 200,
        rotation: 0,
        fill: "#E11D2E",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 0.7,
        visible: true,
        locked: false,
      },
      {
        type: "text",
        name: "Big Title",
        x: 80,
        y: 900,
        width: 920,
        height: 100,
        rotation: 0,
        fill: "transparent",
        stroke: "#FFFFFF",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "Story Title",
        fontSize: 96,
        fontFamily: "Inter",
        bold: true,
        italic: false,
      },
      {
        type: "text",
        name: "Caption",
        x: 80,
        y: 1040,
        width: 920,
        height: 50,
        rotation: 0,
        fill: "transparent",
        stroke: "#8b93a7",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "Swipe up for more",
        fontSize: 40,
        fontFamily: "Inter",
        bold: false,
        italic: true,
      },
    ],
  },
  banner: {
    name: "Banner",
    bg: "#0b0b0f",
    w: 1200,
    h: 627,
    shapes: [
      {
        type: "rect",
        name: "BG",
        x: 0,
        y: 0,
        width: 1200,
        height: 627,
        rotation: 0,
        fill: "#14151c",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: true,
      },
      {
        type: "rect",
        name: "Left Bar",
        x: 0,
        y: 0,
        width: 8,
        height: 627,
        rotation: 0,
        fill: "#E11D2E",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
      },
      {
        type: "circle",
        name: "Logo Circle",
        x: 80,
        y: 200,
        width: 220,
        height: 220,
        rotation: 0,
        fill: "#E11D2E",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 0.15,
        visible: true,
        locked: false,
      },
      {
        type: "text",
        name: "Headline",
        x: 340,
        y: 220,
        width: 820,
        height: 70,
        rotation: 0,
        fill: "transparent",
        stroke: "#FFFFFF",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "Professional Banner",
        fontSize: 60,
        fontFamily: "Inter",
        bold: true,
        italic: false,
      },
      {
        type: "text",
        name: "Sub",
        x: 340,
        y: 320,
        width: 820,
        height: 40,
        rotation: 0,
        fill: "transparent",
        stroke: "#8b93a7",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "Your tagline goes here",
        fontSize: 32,
        fontFamily: "Inter",
        bold: false,
        italic: false,
      },
    ],
  },
  poster: {
    name: "Poster",
    bg: "#0b0b0f",
    w: 800,
    h: 1100,
    shapes: [
      {
        type: "rect",
        name: "BG",
        x: 0,
        y: 0,
        width: 800,
        height: 1100,
        rotation: 0,
        fill: "#0b0b0f",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: true,
      },
      {
        type: "rect",
        name: "Top Band",
        x: 0,
        y: 0,
        width: 800,
        height: 320,
        rotation: 0,
        fill: "#E11D2E",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
      },
      {
        type: "triangle",
        name: "Divider",
        x: 0,
        y: 280,
        width: 800,
        height: 80,
        rotation: 0,
        fill: "#0b0b0f",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
      },
      {
        type: "text",
        name: "Event Title",
        x: 60,
        y: 90,
        width: 680,
        height: 80,
        rotation: 0,
        fill: "transparent",
        stroke: "#FFFFFF",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "EVENT TITLE",
        fontSize: 64,
        fontFamily: "Inter",
        bold: true,
        italic: false,
      },
      {
        type: "text",
        name: "Date",
        x: 60,
        y: 420,
        width: 680,
        height: 50,
        rotation: 0,
        fill: "transparent",
        stroke: "#E11D2E",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "April 2026 · FStudioX",
        fontSize: 28,
        fontFamily: "Inter",
        bold: false,
        italic: false,
      },
      {
        type: "text",
        name: "Details",
        x: 60,
        y: 490,
        width: 680,
        height: 100,
        rotation: 0,
        fill: "transparent",
        stroke: "#8b93a7",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "Add your event details, venue\nand important info here.",
        fontSize: 22,
        fontFamily: "Inter",
        bold: false,
        italic: false,
      },
    ],
  },
};
