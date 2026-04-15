import {
  Clapperboard,
  Film,
  FolderOpen,
  ImageIcon,
  Instagram,
  Music,
  Palette,
  Smartphone,
  Type,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Page } from "../App";
import type { ToolId } from "../components/studio/Sidebar";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface LandingProps {
  onNavigate: (page: Page, tool?: ToolId) => void;
}

const INSTAGRAM_URL =
  "https://www.instagram.com/_f_a_i_s_a_l__r_a_z_a_?igsh=MXV3aXZzeXdubnR2dw==";

const editors: {
  id: ToolId;
  icon: React.ElementType;
  label: string;
  desc: string;
  ocid: string;
  badge?: string;
}[] = [
  {
    id: "image",
    icon: ImageIcon,
    label: "Photo Editor",
    desc: "Filters, beauty tools, background removal & more",
    ocid: "home.photo_editor.card",
    badge: "CapCut-level",
  },
  {
    id: "video",
    icon: Clapperboard,
    label: "Video Editor",
    desc: "Trim, timeline, speed, overlays & effects",
    ocid: "home.video_editor.card",
    badge: "Multi-track",
  },
  {
    id: "text",
    icon: Type,
    label: "Text Editor",
    desc: "Fonts, shadows, glow effects & PNG export",
    ocid: "home.text_editor.card",
  },
  {
    id: "design",
    icon: Palette,
    label: "Design Editor",
    desc: "Shapes, layers, templates & 1000+ fonts",
    ocid: "home.design_editor.card",
    badge: "Canva-style",
  },
  {
    id: "music",
    icon: Music,
    label: "Music Editor",
    desc: "Import, trim, effects, voiceover & library",
    ocid: "home.music_editor.card",
    badge: "40 tracks",
  },
  {
    id: "t2v",
    icon: Film,
    label: "Text → Video",
    desc: "Kinetic typography, transitions & MP4 export",
    ocid: "home.t2v_editor.card",
    badge: "New",
  },
];

export default function Landing({ onNavigate }: LandingProps) {
  const { canInstall, isIOS, isInstalled, promptInstall } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [hovered, setHovered] = useState<ToolId | null>(null);

  useEffect(() => {
    document.title = "FStudioX — All-in-One Creative Studio";
  }, []);

  const handleInstallClick = () => {
    if (isIOS) setShowIOSModal(true);
    else promptInstall();
  };

  const showInstallUI = !isInstalled && canInstall;

  return (
    <div
      className="landing-bg min-h-screen flex flex-col"
      style={{ color: "var(--fsx-text-primary)" }}
    >
      {/* Floating background orbs */}
      <div className="fsx-orb fsx-orb-1" aria-hidden="true" />
      <div className="fsx-orb fsx-orb-2" aria-hidden="true" />
      <div className="fsx-orb fsx-orb-3" aria-hidden="true" />

      {/* Sticky Navbar */}
      <header
        className="relative z-50 sticky top-0 border-b"
        data-ocid="nav.header"
        style={{
          backgroundColor: "rgba(11,11,15,0.88)",
          borderColor: "var(--fsx-border)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="relative flex items-center justify-center rounded-lg overflow-hidden select-none"
              style={{
                width: 36,
                height: 36,
                backgroundColor: "var(--fsx-accent)",
                boxShadow: "0 0 14px rgba(225,29,46,0.4)",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute font-heading font-extrabold text-white select-none"
                style={{
                  fontSize: 34,
                  letterSpacing: "-2px",
                  opacity: 0.22,
                  top: -2,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                }}
              >
                X
              </span>
              <span
                className="absolute font-heading font-extrabold text-white leading-none"
                style={{
                  top: 4,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 11,
                  letterSpacing: "1px",
                }}
              >
                FS
              </span>
              <span
                className="absolute font-heading font-bold text-white leading-none"
                style={{
                  bottom: 4,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 5.5,
                  letterSpacing: "0.8px",
                }}
              >
                Studio
              </span>
            </div>
            <span className="font-heading font-bold text-lg text-white tracking-tight">
              FStudio<span style={{ color: "var(--fsx-accent)" }}>X</span>
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {showInstallUI && (
              <button
                type="button"
                data-ocid="nav.install_app.button"
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--fsx-accent)",
                  color: "var(--fsx-accent)",
                  boxShadow: "0 0 10px rgba(225,29,46,0.15)",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.backgroundColor = "rgba(225,29,46,0.12)";
                  btn.style.boxShadow = "0 0 16px rgba(225,29,46,0.3)";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.backgroundColor = "transparent";
                  btn.style.boxShadow = "0 0 10px rgba(225,29,46,0.15)";
                }}
              >
                <Smartphone size={12} />
                Install App
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div
              className="relative flex items-center justify-center rounded-2xl shadow-2xl overflow-hidden select-none"
              style={{
                width: 72,
                height: 72,
                backgroundColor: "var(--fsx-accent)",
                boxShadow:
                  "0 0 40px rgba(225,29,46,0.5), 0 0 80px rgba(225,29,46,0.2)",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute font-heading font-extrabold text-white select-none"
                style={{
                  fontSize: 68,
                  letterSpacing: "-4px",
                  opacity: 0.22,
                  top: -4,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                }}
              >
                X
              </span>
              <span
                className="absolute font-heading font-extrabold text-white leading-none"
                style={{
                  top: 10,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 22,
                  letterSpacing: "2px",
                }}
              >
                FS
              </span>
              <span
                className="absolute font-heading font-bold text-white leading-none"
                style={{
                  bottom: 10,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 11,
                  letterSpacing: "1.5px",
                }}
              >
                Studio
              </span>
            </div>
          </div>

          <h1
            className="fsx-hero-title font-heading font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight text-white mb-4"
            style={{ lineHeight: 1.05 }}
          >
            FStudio<span style={{ color: "var(--fsx-accent)" }}>X</span>
          </h1>
          <p
            className="text-base sm:text-xl font-medium tracking-wide max-w-md mx-auto"
            style={{ color: "var(--fsx-text-muted)", lineHeight: 1.6 }}
          >
            Your all-in-one creative studio
          </p>
          <p
            className="text-sm mt-2"
            style={{ color: "rgba(139,147,167,0.6)" }}
          >
            Photo &middot; Video &middot; Text &middot; Design &middot; Music
            &middot; T2V
          </p>
        </div>

        {/* Editor Cards — 2-col mobile, 3-col md, 6-col xl */}
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {editors.map(({ id, icon: Icon, label, desc, ocid, badge }) => {
              const isActive = hovered === id;
              return (
                <button
                  type="button"
                  key={id}
                  data-ocid={ocid}
                  onClick={() => onNavigate("studio", id)}
                  onMouseEnter={() => setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(id)}
                  onBlur={() => setHovered(null)}
                  className="flex flex-col items-center justify-start gap-3 rounded-2xl px-3 pt-6 pb-5 cursor-pointer focus:outline-none"
                  style={{
                    minHeight: 180,
                    backgroundColor: isActive
                      ? "var(--fsx-bg-elevated)"
                      : "var(--fsx-bg-surface)",
                    border: isActive
                      ? "1.5px solid rgba(225,29,46,0.75)"
                      : "1.5px solid rgba(225,29,46,0.18)",
                    boxShadow: isActive
                      ? "0 0 28px rgba(225,29,46,0.3), 0 6px 28px rgba(0,0,0,0.5)"
                      : "0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
                    transform: isActive ? "scale(1.03)" : "scale(1)",
                    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  }}
                  aria-label={`Open ${label}`}
                >
                  {badge && (
                    <span
                      className="self-end text-xs font-semibold px-1.5 py-0.5 rounded-md leading-tight"
                      style={{
                        backgroundColor: "rgba(225,29,46,0.15)",
                        color: "var(--fsx-accent)",
                        fontSize: 9,
                        letterSpacing: "0.3px",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                  {!badge && <div style={{ height: 18 }} />}

                  <div
                    className="flex items-center justify-center rounded-2xl"
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: isActive
                        ? "rgba(225,29,46,0.2)"
                        : "rgba(225,29,46,0.1)",
                      border: isActive
                        ? "1px solid rgba(225,29,46,0.5)"
                        : "1px solid rgba(225,29,46,0.22)",
                      transition: "all 0.2s ease",
                      boxShadow: isActive
                        ? "0 0 20px rgba(225,29,46,0.25)"
                        : "none",
                    }}
                  >
                    <Icon
                      size={28}
                      style={{ color: "var(--fsx-accent)" }}
                      strokeWidth={1.7}
                    />
                  </div>

                  <div className="text-center px-1">
                    <div
                      className="font-heading font-bold text-sm text-white leading-tight mb-1"
                      style={{ letterSpacing: "-0.1px" }}
                    >
                      {label}
                    </div>
                    <div
                      className="text-xs leading-snug"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      {desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* My Projects quick link */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              data-ocid="home.projects.quick_link"
              onClick={() => onNavigate("studio", "projects")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border"
              style={{
                backgroundColor: "transparent",
                borderColor: "var(--fsx-border)",
                color: "var(--fsx-text-secondary)",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = "rgba(225,29,46,0.45)";
                btn.style.color = "white";
                btn.style.backgroundColor = "rgba(225,29,46,0.06)";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = "var(--fsx-border)";
                btn.style.color = "var(--fsx-text-secondary)";
                btn.style.backgroundColor = "transparent";
              }}
            >
              <FolderOpen size={15} style={{ color: "var(--fsx-accent)" }} />
              Open Projects
            </button>
          </div>
        </div>
      </main>

      {/* Install Banner — shows above footer when not yet installed */}
      {showInstallUI && showBanner && (
        <div
          className="relative z-20 mx-4 mb-4 rounded-2xl overflow-hidden"
          data-ocid="install.banner"
          style={{
            background:
              "linear-gradient(135deg, rgba(225,29,46,0.12) 0%, rgba(11,11,15,0.95) 60%)",
            border: "1px solid rgba(225,29,46,0.35)",
            boxShadow:
              "0 0 32px rgba(225,29,46,0.15), 0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            {/* App icon */}
            <div
              className="flex-shrink-0 relative flex items-center justify-center rounded-xl overflow-hidden"
              style={{
                width: 48,
                height: 48,
                backgroundColor: "var(--fsx-accent)",
                boxShadow: "0 0 18px rgba(225,29,46,0.45)",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute font-heading font-extrabold text-white"
                style={{
                  fontSize: 44,
                  opacity: 0.2,
                  top: -2,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  letterSpacing: "-3px",
                }}
              >
                X
              </span>
              <span
                className="absolute font-heading font-extrabold text-white leading-none"
                style={{
                  top: 7,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 14,
                  letterSpacing: "1.5px",
                }}
              >
                FS
              </span>
              <span
                className="absolute font-heading font-bold text-white leading-none"
                style={{
                  bottom: 7,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 7,
                  letterSpacing: "0.5px",
                }}
              >
                Studio
              </span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-white text-sm leading-tight">
                Install FStudioX
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                {isIOS
                  ? "Home screen pe add karo — offline bhi kaam karega"
                  : "Home screen pe add karo — faster & offline"}
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              data-ocid="install.banner.cta"
              onClick={handleInstallClick}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
              style={{
                backgroundColor: "var(--fsx-accent)",
                color: "white",
                boxShadow: "0 0 14px rgba(225,29,46,0.4)",
                letterSpacing: "0.2px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 22px rgba(225,29,46,0.65)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 14px rgba(225,29,46,0.4)";
              }}
            >
              <Smartphone size={13} />
              Install
            </button>

            {/* Dismiss */}
            <button
              type="button"
              data-ocid="install.banner.dismiss"
              onClick={() => setShowBanner(false)}
              className="flex-shrink-0 flex items-center justify-center rounded-lg p-1.5 transition-colors duration-200"
              style={{ color: "var(--fsx-text-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "white";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--fsx-text-muted)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
              }}
              aria-label="Dismiss install banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="relative z-10 border-t py-6 px-5"
        style={{
          borderColor: "var(--fsx-border)",
          backgroundColor: "rgba(11,11,15,0.7)",
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="relative flex items-center justify-center rounded-md"
              style={{
                width: 26,
                height: 26,
                backgroundColor: "var(--fsx-accent)",
              }}
            >
              <span
                className="font-heading font-extrabold text-white"
                style={{ fontSize: 13, letterSpacing: "-0.5px" }}
              >
                X
              </span>
            </div>
            <span className="font-heading font-bold text-sm text-white">
              FStudio<span style={{ color: "var(--fsx-accent)" }}>X</span>
            </span>
          </div>

          <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
            &copy; {new Date().getFullYear()} FStudioX. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--fsx-accent)" }}
            >
              caffeine.ai
            </a>
          </p>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="footer.instagram.link"
            className="flex items-center gap-1.5 text-xs transition-colors duration-200"
            style={{ color: "var(--fsx-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--fsx-accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fsx-text-muted)";
            }}
          >
            <Instagram size={13} />
            @_f_a_i_s_a_l__r_a_z_a_
          </a>
        </div>
      </footer>

      {/* iOS Install Modal */}
      {showIOSModal && (
        <>
          <button
            type="button"
            aria-label="Close install instructions"
            className="fixed inset-0 z-50 w-full h-full border-0 p-0"
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
              cursor: "default",
            }}
            onClick={() => setShowIOSModal(false)}
          />
          <dialog
            open
            aria-label="iOS Install Instructions"
            className="fixed bottom-4 left-1/2 z-50 w-full max-w-sm rounded-3xl overflow-hidden p-0 bg-transparent border-0"
            style={{
              transform: "translateX(-50%)",
              backgroundColor: "var(--fsx-bg-surface)",
              border: "1px solid rgba(225,29,46,0.35)",
              boxShadow:
                "0 0 60px rgba(225,29,46,0.2), 0 20px 60px rgba(0,0,0,0.7)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-5 pb-4"
              style={{ borderBottom: "1px solid var(--fsx-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-xl relative overflow-hidden"
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: "var(--fsx-accent)",
                    boxShadow: "0 0 16px rgba(225,29,46,0.45)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute font-heading font-extrabold text-white"
                    style={{
                      fontSize: 40,
                      opacity: 0.2,
                      top: -2,
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      letterSpacing: "-3px",
                    }}
                  >
                    X
                  </span>
                  <span
                    className="absolute font-heading font-extrabold text-white leading-none"
                    style={{
                      top: 6,
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      fontSize: 13,
                      letterSpacing: "1px",
                    }}
                  >
                    FS
                  </span>
                  <span
                    className="absolute font-heading font-bold text-white leading-none"
                    style={{
                      bottom: 6,
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      fontSize: 6.5,
                      letterSpacing: "0.4px",
                    }}
                  >
                    Studio
                  </span>
                </div>
                <div>
                  <p className="font-heading font-bold text-white text-sm">
                    Install FStudioX
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--fsx-text-muted)" }}
                  >
                    iOS / Safari
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="flex items-center justify-center rounded-xl w-8 h-8"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "var(--fsx-text-muted)",
                }}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Steps */}
            <div className="px-5 py-5 space-y-4">
              {[
                {
                  step: "1",
                  en: "Tap the Share button (□↑) in Safari toolbar",
                  ur: "Safari mein neeche Share button (□↑) dabao",
                },
                {
                  step: "2",
                  en: 'Scroll down and tap "Add to Home Screen"',
                  ur: '"Add to Home Screen" pe tap karo',
                },
                {
                  step: "3",
                  en: 'Tap "Add" in the top-right corner',
                  ur: 'Upar daayein "Add" dabao',
                },
              ].map(({ step, en, ur }) => (
                <div key={step} className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full font-heading font-bold text-white text-xs"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: "var(--fsx-accent)",
                      boxShadow: "0 0 10px rgba(225,29,46,0.35)",
                      fontSize: 12,
                    }}
                  >
                    {step}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-white font-medium leading-snug">
                      {en}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: "var(--fsx-text-muted)",
                        fontFamily: "inherit",
                      }}
                    >
                      {ur}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div
              className="mx-5 mb-5 px-4 py-3 rounded-xl"
              style={{
                backgroundColor: "rgba(225,29,46,0.08)",
                border: "1px solid rgba(225,29,46,0.2)",
              }}
            >
              <p className="text-xs text-white font-medium leading-snug">
                📱 App will appear on your home screen just like other apps —
                with the FStudioX logo and name.
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                Home screen pe FStudioX icon aur naam bilkul doosre apps ki
                tarah nazar aayega.
              </p>
            </div>
          </dialog>
        </>
      )}
    </div>
  );
}
