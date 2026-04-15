import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS (iPhone / iPad / iPod)
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // Check if already running as installed PWA (standalone mode)
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const standaloneNav =
      "standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true;
    if (standaloneMedia.matches || standaloneNav) {
      setIsInstalled(true);
    }

    // Listen for display-mode changes (e.g. user installs mid-session)
    const onDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    standaloneMedia.addEventListener("change", onDisplayChange);

    // Capture the native install prompt (Android / Chrome desktop)
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
      standaloneMedia.removeEventListener("change", onDisplayChange);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  // canInstall: native prompt available (Android/Chrome) or iOS (show manual steps)
  const canInstall = !isInstalled && (deferredPrompt !== null || isIOS);

  return { canInstall, isIOS, isInstalled, promptInstall };
}
