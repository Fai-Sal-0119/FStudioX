import {
  Check,
  ChevronDown,
  ChevronRight,
  Hexagon,
  LayoutTemplate,
  MessageSquare,
  Palette,
  Sparkles,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CanvasShape, TemplateName } from "./types";
import { TEMPLATES, generateId, shapeName } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIAssistPanelProps {
  onApplyPalette: (bg: string, shapeFill: string) => void;
  onAddTextShape: (text: string) => void;
  onApplyTemplate: (name: TemplateName) => void;
  onLoadLogo: (shapes: CanvasShape[]) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

type PaletteHarmony = "Complementary" | "Triadic" | "Analogous" | "Split";
type FontStyle = "Elegant" | "Modern" | "Playful" | "Bold" | "Minimal";
type DesignType = "Social Post" | "Story" | "Poster" | "Thumbnail" | "Card";
type Section = "palette" | "font" | "text" | "template" | "logo";

interface ColorPalette {
  name: PaletteHarmony;
  colors: string[];
}

export interface FontPair {
  heading: string;
  body: string;
}

// ─── HSL Color Utilities ──────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(hIn: number, sIn: number, lIn: number): string {
  const h = ((hIn % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, sIn));
  const l = Math.max(0, Math.min(100, lIn));
  const hs = s / 100;
  const hl = l / 100;
  const c = (1 - Math.abs(2 * hl - 1)) * hs;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = hl - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generatePalettes(seed: string): ColorPalette[] {
  const [h, s, l] = hexToHsl(seed);
  const bl = l < 40 ? 20 : 10;
  return [
    {
      name: "Complementary",
      colors: [
        seed,
        hslToHex(h, s, l - 20),
        hslToHex(h + 180, s, l),
        hslToHex(h + 180, s, l - 20),
        hslToHex(h, s * 0.4, bl),
      ],
    },
    {
      name: "Triadic",
      colors: [
        seed,
        hslToHex(h + 120, s, l),
        hslToHex(h + 240, s, l),
        hslToHex(h + 120, s, l - 15),
        hslToHex(h, s * 0.3, bl),
      ],
    },
    {
      name: "Analogous",
      colors: [
        hslToHex(h - 30, s, l),
        seed,
        hslToHex(h + 30, s, l),
        hslToHex(h + 60, s, l - 10),
        hslToHex(h, s * 0.3, bl),
      ],
    },
    {
      name: "Split",
      colors: [
        seed,
        hslToHex(h + 150, s, l),
        hslToHex(h + 210, s, l),
        hslToHex(h + 150, s, l - 20),
        hslToHex(h, s * 0.3, bl),
      ],
    },
  ];
}

// ─── Font Pairs ───────────────────────────────────────────────────────────────

const FONT_PAIRS: Record<FontStyle, FontPair[]> = {
  Elegant: [
    { heading: "Playfair Display", body: "Lato" },
    { heading: "Cormorant Garamond", body: "Montserrat" },
    { heading: "EB Garamond", body: "Source Sans Pro" },
  ],
  Modern: [
    { heading: "Inter", body: "DM Sans" },
    { heading: "Syne", body: "Inter" },
    { heading: "Space Grotesk", body: "Nunito Sans" },
  ],
  Playful: [
    { heading: "Fredoka One", body: "Nunito" },
    { heading: "Baloo 2", body: "Quicksand" },
    { heading: "Righteous", body: "Dosis" },
  ],
  Bold: [
    { heading: "Anton", body: "Roboto" },
    { heading: "Oswald", body: "Open Sans" },
    { heading: "Black Han Sans", body: "Noto Sans" },
  ],
  Minimal: [
    { heading: "Plus Jakarta Sans", body: "Work Sans" },
    { heading: "DM Serif Display", body: "DM Sans" },
    { heading: "Outfit", body: "Manrope" },
  ],
};

// ─── Text Suggestions ─────────────────────────────────────────────────────────

const TEXT_SUGGESTIONS: Record<DesignType, string[]> = {
  "Social Post": [
    "Make It Happen",
    "Every Day Is A New Start",
    "Born to Stand Out",
    "Create. Inspire. Repeat.",
    "Your Story Starts Here",
  ],
  Story: [
    "Swipe to See More ✨",
    "Behind the Scenes",
    "This Changed Everything",
    "Just Dropped 🔥",
    "Don't Miss Out",
  ],
  Poster: [
    "The Night You Won't Forget",
    "Join the Revolution",
    "Experience Something New",
    "It's Bigger Than You Think",
    "Be Part of the Moment",
  ],
  Thumbnail: [
    "You Won't Believe This",
    "Watch Before It's Gone",
    "Everything Changed in 60s",
    "I Tried So You Don't Have To",
    "The Truth About This",
  ],
  Card: [
    "Wishing You Joy & Happiness",
    "Congratulations on Your Achievement",
    "Thank You for Everything",
    "Celebrating You Today",
    "Here's to New Adventures",
  ],
};

// ─── Template Keywords ────────────────────────────────────────────────────────

const TEMPLATE_KEYWORDS: Record<TemplateName, string[]> = {
  "social-post": [
    "social",
    "instagram",
    "post",
    "square",
    "product",
    "launch",
    "announcement",
  ],
  story: [
    "story",
    "vertical",
    "reels",
    "tiktok",
    "birthday",
    "celebration",
    "event",
  ],
  banner: [
    "banner",
    "linkedin",
    "header",
    "cover",
    "travel",
    "landscape",
    "promo",
  ],
  poster: [
    "poster",
    "event",
    "concert",
    "party",
    "flyer",
    "announcement",
    "print",
  ],
  blank: ["blank", "custom", "empty", "start", "new", "fresh"],
};

function matchTemplates(query: string): TemplateName[] {
  if (!query.trim()) return [];
  const words = query.toLowerCase().split(/\s+/);
  const scores: Record<TemplateName, number> = {
    "social-post": 0,
    story: 0,
    banner: 0,
    poster: 0,
    blank: 0,
  };
  for (const [name, keywords] of Object.entries(TEMPLATE_KEYWORDS) as [
    TemplateName,
    string[],
  ][]) {
    for (const word of words) {
      for (const kw of keywords) {
        if (kw.includes(word) || word.includes(kw)) scores[name]++;
      }
    }
  }
  return (Object.keys(scores) as TemplateName[])
    .filter((k) => scores[k] > 0)
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 3);
}

// ─── Logo Generation ──────────────────────────────────────────────────────────

function buildLogoShapes(
  brand: string,
  variant: "lettermark" | "wordmark" | "icon-text",
  canvasW = 800,
  canvasH = 600,
): CanvasShape[] {
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const letter = (brand[0] ?? "F").toUpperCase();

  const rawShapes: Omit<CanvasShape, "id" | "name">[] = (() => {
    if (variant === "lettermark") {
      return [
        {
          type: "rect" as const,
          x: cx - 120,
          y: cy - 120,
          width: 240,
          height: 240,
          rotation: 0,
          fill: "#E11D2E",
          stroke: "transparent",
          strokeWidth: 0,
          opacity: 1,
          visible: true,
          locked: false,
        },
        {
          type: "text" as const,
          x: cx - 100,
          y: cy - 70,
          width: 200,
          height: 140,
          rotation: 0,
          fill: "transparent",
          stroke: "#FFFFFF",
          strokeWidth: 0,
          opacity: 1,
          visible: true,
          locked: false,
          text: letter,
          fontSize: 130,
          fontFamily: "Inter",
          bold: true,
          italic: false,
        },
      ];
    }
    if (variant === "wordmark") {
      return [
        {
          type: "text" as const,
          x: cx - 200,
          y: cy - 50,
          width: 400,
          height: 80,
          rotation: 0,
          fill: "transparent",
          stroke: "#FFFFFF",
          strokeWidth: 0,
          opacity: 1,
          visible: true,
          locked: false,
          text: brand.toUpperCase(),
          fontSize: 52,
          fontFamily: "Inter",
          bold: true,
          italic: false,
        },
        {
          type: "rect" as const,
          x: cx - 200,
          y: cy + 46,
          width: 400,
          height: 5,
          rotation: 0,
          fill: "#E11D2E",
          stroke: "transparent",
          strokeWidth: 0,
          opacity: 1,
          visible: true,
          locked: false,
        },
      ];
    }
    return [
      {
        type: "hexagon" as const,
        x: cx - 260,
        y: cy - 70,
        width: 140,
        height: 140,
        rotation: 0,
        fill: "#E11D2E",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
      },
      {
        type: "text" as const,
        x: cx - 250,
        y: cy - 45,
        width: 120,
        height: 100,
        rotation: 0,
        fill: "transparent",
        stroke: "#FFFFFF",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: letter,
        fontSize: 60,
        fontFamily: "Inter",
        bold: true,
        italic: false,
      },
      {
        type: "text" as const,
        x: cx - 90,
        y: cy - 30,
        width: 360,
        height: 60,
        rotation: 0,
        fill: "transparent",
        stroke: "#FFFFFF",
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: brand,
        fontSize: 42,
        fontFamily: "Inter",
        bold: true,
        italic: false,
      },
    ];
  })();

  return rawShapes.map(
    (s) => ({ ...s, id: generateId(), name: shapeName(s.type) }) as CanvasShape,
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  icon,
  open,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left"
      style={{
        backgroundColor: open
          ? "rgba(225,29,46,0.12)"
          : "var(--fsx-bg-elevated)",
        border: `1px solid ${open ? "rgba(225,29,46,0.3)" : "var(--fsx-border)"}`,
      }}
    >
      <span
        className="flex items-center gap-2 text-xs font-semibold tracking-wide"
        style={{
          color: open ? "var(--fsx-accent)" : "var(--fsx-text-secondary)",
        }}
      >
        {icon} {label}
      </span>
      {open ? (
        <ChevronDown size={13} style={{ color: "var(--fsx-accent)" }} />
      ) : (
        <ChevronRight size={13} style={{ color: "var(--fsx-text-muted)" }} />
      )}
    </button>
  );
}

function SwatchRow({
  colors,
  onApply,
  label,
}: { colors: string[]; onApply: () => void; label: string }) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg"
      style={{
        backgroundColor: "var(--fsx-bg-elevated)",
        border: "1px solid var(--fsx-border)",
      }}
    >
      <span
        className="text-xs w-20 shrink-0"
        style={{ color: "var(--fsx-text-muted)" }}
      >
        {label}
      </span>
      <div className="flex gap-1 flex-1">
        {colors.map((c) => (
          <div
            key={`${label}-${c}`}
            className="flex-1 h-7 rounded"
            style={{ backgroundColor: c, minWidth: "20px" }}
            title={c}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onApply}
        className="flex items-center gap-1 px-2 h-7 rounded text-xs font-medium shrink-0 transition-all"
        style={{ backgroundColor: "var(--fsx-accent)", color: "white" }}
        data-ocid={`ai_panel.apply_palette.${label.toLowerCase()}`}
      >
        <Check size={10} /> Apply
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistPanel({
  onApplyPalette,
  onAddTextShape,
  onApplyTemplate,
  onLoadLogo,
  canvasRef,
}: AIAssistPanelProps) {
  const [openSection, setOpenSection] = useState<Section | null>("palette");
  const [seedColor, setSeedColor] = useState("#E11D2E");
  const [palettes, setPalettes] = useState<ColorPalette[]>(() =>
    generatePalettes("#E11D2E"),
  );
  const [fontStyle, setFontStyle] = useState<FontStyle>("Modern");
  const [appliedFont, setAppliedFont] = useState<FontPair | null>(null);
  const [designType, setDesignType] = useState<DesignType>("Social Post");
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateMatches, setTemplateMatches] = useState<TemplateName[]>([]);
  const [brandName, setBrandName] = useState("");
  const [logoVariant, setLogoVariant] = useState<
    "lettermark" | "wordmark" | "icon-text" | null
  >(null);
  const fontPreviewRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    setPalettes(generatePalettes(seedColor));
  }, [seedColor]);

  useEffect(() => {
    if (openSection !== "font") return;
    const pairs = FONT_PAIRS[fontStyle];
    pairs.forEach((pair, i) => {
      const canvas = fontPreviewRefs.current[i];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#14151c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 14px "${pair.heading}", Inter, sans-serif`;
      ctx.fillText(`Aa — ${pair.heading}`, 8, 22);
      ctx.fillStyle = "#8b93a7";
      ctx.font = `12px "${pair.body}", Inter, sans-serif`;
      ctx.fillText(`Body: ${pair.body}`, 8, 40);
    });
  }, [openSection, fontStyle]);

  useEffect(() => {
    if (openSection !== "font") return;
    const pairs = FONT_PAIRS[fontStyle];
    const allFonts = pairs.flatMap((p) => [p.heading, p.body]);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    const families = [...new Set(allFonts)]
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;700`)
      .join("&");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }, [openSection, fontStyle]);

  const toggleSection = (s: Section) =>
    setOpenSection((prev) => (prev === s ? null : s));

  const handleExtractColors = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorMap: Record<string, number> = {};
    const step = 40;
    for (let i = 0; i < data.length; i += 4 * step) {
      const rv = data[i];
      const gv = data[i + 1];
      const bv = data[i + 2];
      const a = data[i + 3];
      if ((a ?? 0) < 128) continue;
      const qr = Math.round((rv ?? 0) / 32) * 32;
      const qg = Math.round((gv ?? 0) / 32) * 32;
      const qb = Math.round((bv ?? 0) / 32) * 32;
      const key = `${qr},${qg},${qb}`;
      colorMap[key] = (colorMap[key] ?? 0) + 1;
    }
    const sorted = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1);
    if (sorted.length > 0 && sorted[0]) {
      const [kv] = sorted[0];
      const parts = kv.split(",").map(Number);
      const hexColor = `#${(parts[0] ?? 0).toString(16).padStart(2, "0")}${(parts[1] ?? 0).toString(16).padStart(2, "0")}${(parts[2] ?? 0).toString(16).padStart(2, "0")}`;
      setSeedColor(hexColor);
    }
  };

  const logoVariantDefs = [
    {
      key: "lettermark" as const,
      label: "A — Letter-mark",
      desc: "Bold letter on accent background",
    },
    {
      key: "wordmark" as const,
      label: "B — Word-mark",
      desc: "Brand name + decorative underline",
    },
    {
      key: "icon-text" as const,
      label: "C — Icon + Text",
      desc: "Hexagon icon beside brand name",
    },
  ];

  return (
    <div
      className="flex flex-col gap-2 p-3 overflow-y-auto h-full"
      style={{ backgroundColor: "var(--fsx-bg-primary)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 pb-2"
        style={{ borderBottom: "1px solid var(--fsx-border)" }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: "rgba(225,29,46,0.2)" }}
        >
          <Sparkles size={13} style={{ color: "var(--fsx-accent)" }} />
        </div>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--fsx-text-primary)" }}
        >
          AI Assist
        </span>
        <span
          className="text-xs ml-auto px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: "rgba(225,29,46,0.15)",
            color: "var(--fsx-accent)",
          }}
        >
          BETA
        </span>
      </div>

      {/* ── 1. AI Color Palette ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionHeader
          label="AI Color Palette"
          icon={<Palette size={12} />}
          open={openSection === "palette"}
          onToggle={() => toggleSection("palette")}
        />
        {openSection === "palette" && (
          <div className="flex flex-col gap-2 pl-1">
            <div className="flex gap-2 items-center">
              <label
                htmlFor="ai-seed-color"
                className="text-xs shrink-0"
                style={{ color: "var(--fsx-text-secondary)" }}
              >
                Seed color
              </label>
              <input
                id="ai-seed-color"
                type="color"
                value={seedColor}
                onChange={(e) => setSeedColor(e.target.value)}
                data-ocid="ai_panel.seed_color.input"
                className="w-8 h-7 rounded cursor-pointer border-0 outline-none p-0"
              />
              <span
                className="text-xs font-mono"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                {seedColor}
              </span>
              <button
                type="button"
                onClick={handleExtractColors}
                className="ml-auto text-xs px-2 py-1 rounded transition-all"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                  color: "var(--fsx-text-secondary)",
                }}
                data-ocid="ai_panel.extract_colors.button"
                title="Extract dominant color from canvas"
              >
                From Canvas
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {palettes.map((p) => (
                <SwatchRow
                  key={p.name}
                  label={p.name}
                  colors={p.colors}
                  onApply={() =>
                    onApplyPalette(p.colors[4] ?? p.colors[0], p.colors[0])
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 2. AI Font Matcher ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionHeader
          label="AI Font Matcher"
          icon={<Type size={12} />}
          open={openSection === "font"}
          onToggle={() => toggleSection("font")}
        />
        {openSection === "font" && (
          <div className="flex flex-col gap-2 pl-1">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  "Elegant",
                  "Modern",
                  "Playful",
                  "Bold",
                  "Minimal",
                ] as FontStyle[]
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFontStyle(s)}
                  data-ocid={`ai_panel.font_style.${s.toLowerCase()}`}
                  className="px-2.5 h-7 rounded text-xs font-medium transition-all"
                  style={{
                    backgroundColor:
                      fontStyle === s
                        ? "rgba(225,29,46,0.18)"
                        : "var(--fsx-bg-elevated)",
                    border: `1px solid ${fontStyle === s ? "rgba(225,29,46,0.4)" : "var(--fsx-border)"}`,
                    color:
                      fontStyle === s
                        ? "var(--fsx-accent)"
                        : "var(--fsx-text-secondary)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              {FONT_PAIRS[fontStyle].map((pair, idx) => (
                <div
                  key={`${pair.heading}-${pair.body}`}
                  className="rounded-lg overflow-hidden"
                  style={{
                    border: `1px solid ${appliedFont?.heading === pair.heading ? "rgba(225,29,46,0.4)" : "var(--fsx-border)"}`,
                  }}
                >
                  <canvas
                    ref={(el) => {
                      fontPreviewRefs.current[idx] = el;
                    }}
                    width={240}
                    height={50}
                    className="w-full"
                    style={{ display: "block" }}
                  />
                  <div
                    className="flex items-center justify-between px-2 py-1.5"
                    style={{ backgroundColor: "var(--fsx-bg-elevated)" }}
                  >
                    <span
                      className="text-xs truncate flex-1 min-w-0 mr-2"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      {pair.heading} + {pair.body}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedFont(pair)}
                      data-ocid={`ai_panel.apply_font.${pair.heading.replace(/\s/g, "_")}`}
                      className="flex items-center gap-1 px-2 h-6 rounded text-xs font-medium transition-all shrink-0"
                      style={{
                        backgroundColor: "var(--fsx-accent)",
                        color: "white",
                      }}
                    >
                      {appliedFont?.heading === pair.heading ? (
                        <>
                          <Check size={9} /> Applied
                        </>
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {appliedFont && (
              <div
                className="text-xs p-2 rounded-lg"
                style={{
                  backgroundColor: "rgba(225,29,46,0.1)",
                  border: "1px solid rgba(225,29,46,0.2)",
                  color: "var(--fsx-accent)",
                }}
              >
                ✓ Next text element will use{" "}
                <strong>{appliedFont.heading}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. AI Text Suggestions ─────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionHeader
          label="AI Text Suggestions"
          icon={<MessageSquare size={12} />}
          open={openSection === "text"}
          onToggle={() => toggleSection("text")}
        />
        {openSection === "text" && (
          <div className="flex flex-col gap-2 pl-1">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  "Social Post",
                  "Story",
                  "Poster",
                  "Thumbnail",
                  "Card",
                ] as DesignType[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDesignType(t)}
                  data-ocid={`ai_panel.design_type.${t.toLowerCase().replace(/\s/g, "_")}`}
                  className="px-2 h-7 rounded text-xs font-medium transition-all"
                  style={{
                    backgroundColor:
                      designType === t
                        ? "rgba(225,29,46,0.18)"
                        : "var(--fsx-bg-elevated)",
                    border: `1px solid ${designType === t ? "rgba(225,29,46,0.4)" : "var(--fsx-border)"}`,
                    color:
                      designType === t
                        ? "var(--fsx-accent)"
                        : "var(--fsx-text-secondary)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {TEXT_SUGGESTIONS[designType].map((text) => (
                <div
                  key={text}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    border: "1px solid var(--fsx-border)",
                  }}
                >
                  <span
                    className="text-xs flex-1 min-w-0 truncate"
                    style={{ color: "var(--fsx-text-primary)" }}
                  >
                    {text}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddTextShape(text)}
                    data-ocid={`ai_panel.add_text.${text.slice(0, 12).replace(/[\s\W]/g, "_")}`}
                    className="shrink-0 text-xs px-2 h-6 rounded font-medium transition-all"
                    style={{
                      backgroundColor: "var(--fsx-accent)",
                      color: "white",
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. AI Template Recommend ───────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionHeader
          label="Template Recommend"
          icon={<LayoutTemplate size={12} />}
          open={openSection === "template"}
          onToggle={() => toggleSection("template")}
        />
        {openSection === "template" && (
          <div className="flex flex-col gap-2 pl-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={templateQuery}
                onChange={(e) => setTemplateQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    setTemplateMatches(matchTemplates(templateQuery));
                }}
                placeholder="birthday party, product launch…"
                data-ocid="ai_panel.template_query.input"
                className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                  color: "white",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setTemplateMatches(matchTemplates(templateQuery))
                }
                data-ocid="ai_panel.template_search.button"
                className="px-3 h-8 rounded-lg text-xs font-medium transition-all"
                style={{ backgroundColor: "var(--fsx-accent)", color: "white" }}
              >
                Match
              </button>
            </div>
            {templateMatches.length === 0 && (
              <p
                className="text-xs text-center py-2"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                Type your design intent and press Match
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              {templateMatches.map((name) => {
                const t = TEMPLATES[name];
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: "var(--fsx-bg-elevated)",
                      border: "1px solid var(--fsx-border)",
                    }}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--fsx-text-primary)" }}
                      >
                        {t.name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        {t.w}×{t.h}
                      </span>
                    </div>
                    <div
                      className="w-10 h-10 rounded shrink-0"
                      style={{
                        backgroundColor: t.bg,
                        border: "1px solid var(--fsx-border)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => onApplyTemplate(name)}
                      data-ocid={`ai_panel.use_template.${name}`}
                      className="shrink-0 text-xs px-2 h-7 rounded font-medium transition-all"
                      style={{
                        backgroundColor: "var(--fsx-accent)",
                        color: "white",
                      }}
                    >
                      Use
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. AI Logo Suggestion ──────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionHeader
          label="AI Logo Suggestion"
          icon={<Hexagon size={12} />}
          open={openSection === "logo"}
          onToggle={() => toggleSection("logo")}
        />
        {openSection === "logo" && (
          <div className="flex flex-col gap-2 pl-1">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your brand name…"
              data-ocid="ai_panel.brand_name.input"
              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                border: "1px solid var(--fsx-border)",
                color: "white",
              }}
            />
            {brandName.trim().length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {logoVariantDefs.map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-all"
                    style={{
                      backgroundColor:
                        logoVariant === key
                          ? "rgba(225,29,46,0.1)"
                          : "var(--fsx-bg-elevated)",
                      border: `1px solid ${logoVariant === key ? "rgba(225,29,46,0.3)" : "var(--fsx-border)"}`,
                    }}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color:
                            logoVariant === key
                              ? "var(--fsx-accent)"
                              : "var(--fsx-text-primary)",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        {desc}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoVariant(key);
                        onLoadLogo(buildLogoShapes(brandName.trim(), key));
                      }}
                      data-ocid={`ai_panel.use_logo.${key}`}
                      className="shrink-0 text-xs px-2 h-7 rounded font-medium transition-all"
                      style={{
                        backgroundColor: "var(--fsx-accent)",
                        color: "white",
                      }}
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-xs text-center py-2"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                Enter your brand name to generate logos
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
