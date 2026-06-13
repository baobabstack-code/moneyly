"use client";

import { useState, useEffect } from "react";

export function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log("PWA was installed");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setInstallPrompt(null);
    } else {
      // Manual instruction for iOS or unsupported browsers
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("To install Moneyly on your iPhone: \n\n1. Tap the Share button (bottom center) \n2. Scroll down and tap 'Add to Home Screen' \n3. Tap 'Add' to confirm.");
      } else {
        alert("To install Moneyly: \n\n1. Open your browser menu (menu icon) \n2. Select 'Install App' or 'Add to Home Screen'.");
      }
    }
  };

  if (isInstalled) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-3 px-8 py-4 bg-surface border-2 border-outline-variant text-on-surface font-bold rounded-2xl hover:border-secondary hover:bg-surface-container transition-all shadow-xl active:scale-95 group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <span className="material-symbols-outlined text-secondary text-2xl group-hover:scale-110 transition-transform">
        {installPrompt ? "install_mobile" : "download_for_offline"}
      </span>
      <div className="flex flex-col items-start leading-none">
        <span className="text-sm uppercase tracking-[0.1em] mb-1">
          {installPrompt ? "Install App" : "Download App"}
        </span>
        <span className="text-[10px] text-on-surface-variant font-medium">Native money workspace</span>
      </div>
    </button>
  );
}
