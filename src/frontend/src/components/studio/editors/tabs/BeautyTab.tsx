// ─── Beauty Tab ───────────────────────────────────────────────────────────────
import { SliderControl, TabSectionHeader } from "../ImageEditorShared";

export interface BeautyState {
  smoothing: number;
  whitening: number;
  eyeEnhance: number;
  slimFace: number;
  teethWhitening: number;
}

export const DEFAULT_BEAUTY: BeautyState = {
  smoothing: 0,
  whitening: 0,
  eyeEnhance: 0,
  slimFace: 0,
  teethWhitening: 0,
};

const BEAUTY_PRESETS: { label: string; emoji: string; values: BeautyState }[] =
  [
    {
      label: "Natural",
      emoji: "🌿",
      values: {
        smoothing: 20,
        whitening: 10,
        eyeEnhance: 15,
        slimFace: 5,
        teethWhitening: 8,
      },
    },
    {
      label: "Soft",
      emoji: "🌸",
      values: {
        smoothing: 45,
        whitening: 25,
        eyeEnhance: 20,
        slimFace: 10,
        teethWhitening: 15,
      },
    },
    {
      label: "Glow",
      emoji: "✨",
      values: {
        smoothing: 35,
        whitening: 50,
        eyeEnhance: 40,
        slimFace: 0,
        teethWhitening: 30,
      },
    },
    {
      label: "Portrait",
      emoji: "💎",
      values: {
        smoothing: 55,
        whitening: 40,
        eyeEnhance: 50,
        slimFace: 15,
        teethWhitening: 25,
      },
    },
    {
      label: "Flawless",
      emoji: "💄",
      values: {
        smoothing: 80,
        whitening: 65,
        eyeEnhance: 70,
        slimFace: 20,
        teethWhitening: 50,
      },
    },
  ];

const BEAUTY_SLIDERS: {
  key: keyof BeautyState;
  label: string;
  icon: string;
}[] = [
  { key: "smoothing", label: "Skin Smoothing", icon: "✨" },
  { key: "whitening", label: "Brightening", icon: "🌟" },
  { key: "eyeEnhance", label: "Eye Enhance", icon: "👁" },
  { key: "slimFace", label: "Slim Face", icon: "💫" },
  { key: "teethWhitening", label: "Teeth Whitening", icon: "😁" },
];

export function BeautyTab({
  beauty,
  onChange,
}: {
  beauty: BeautyState;
  onChange: (key: keyof BeautyState, value: number) => void;
}) {
  const applyPreset = (preset: BeautyState) => {
    for (const k of Object.keys(preset) as (keyof BeautyState)[]) {
      onChange(k, preset[k]);
    }
  };

  return (
    <div className="space-y-4">
      <TabSectionHeader>Beauty & Skin Retouching</TabSectionHeader>
      <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
        Skin-aware canvas processing. Applied on export to PNG.
      </p>

      {/* Beauty presets */}
      <div className="space-y-2">
        <span
          className="text-xs"
          style={{ color: "var(--fsx-text-secondary)" }}
        >
          Quick Presets
        </span>
        <div className="flex gap-2 flex-wrap">
          {BEAUTY_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              data-ocid={`image_editor.beauty_preset.${p.label.toLowerCase()}`}
              onClick={() => applyPreset(p.values)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                color: "var(--fsx-text-secondary)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <span>{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual sliders */}
      <div className="space-y-4">
        {BEAUTY_SLIDERS.map((s) => (
          <SliderControl
            key={s.key}
            label={s.label}
            icon={s.icon}
            value={beauty[s.key]}
            min={0}
            max={100}
            onChange={(v) => onChange(s.key, v)}
          />
        ))}
      </div>

      {/* Reset */}
      <button
        type="button"
        data-ocid="image_editor.beauty_reset.button"
        onClick={() => applyPreset(DEFAULT_BEAUTY)}
        className="w-full py-1.5 rounded-lg text-xs transition-colors"
        style={{
          backgroundColor: "var(--fsx-bg-elevated)",
          color: "var(--fsx-text-muted)",
          border: "1px solid var(--fsx-border)",
        }}
      >
        Reset Beauty
      </button>

      {/* Tips */}
      <div
        className="rounded-lg p-3 space-y-1.5"
        style={{
          backgroundColor: "var(--fsx-bg-elevated)",
          border: "1px solid var(--fsx-border)",
        }}
      >
        <p
          className="text-[10px] font-semibold"
          style={{ color: "var(--fsx-text-secondary)" }}
        >
          ✦ Beauty Tips
        </p>
        <ul className="space-y-1">
          {[
            "Natural: subtle, everyday look",
            "Smoothing: 20-40 for natural skin",
            "Brightening: targets skin-tone pixels only",
            "Slim Face: subtle 1-20 range recommended",
          ].map((tip) => (
            <li
              key={tip}
              className="text-[10px]"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              · {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
