"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-surface-container-low border border-outline-variant">
        <span className="material-symbols-outlined text-on-surface-variant">light_mode</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-surface-container-low border border-outline-variant hover:bg-surface-container transition-all active:scale-95"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-on-surface-variant">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
