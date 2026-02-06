import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { THEMES, FONT_PRESETS } from "../constants/themes";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  fonts: {
    body: "manrope",
    heading: "manrope",
    monospace: "jetbrains-mono",
  },
  setFonts: () => {},
  customColors: {},
  setCustomColors: () => {},
  resetToDefault: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // --- State Initialization ---
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem("themeId") || "light";
  });

  const [fonts, setFontsState] = useState(() => {
    const saved = localStorage.getItem("fonts");
    return saved ? JSON.parse(saved) : {
      body: "manrope",
      heading: "manrope",
      monospace: "jetbrains-mono",
    };
  });

  const [customColors, setCustomColorsState] = useState(() => {
    const saved = localStorage.getItem("customColors");
    return saved ? JSON.parse(saved) : {};
  });

  // --- Theme Application Logic ---
  const applyTheme = useCallback((id, custom = {}) => {
    const root = document.documentElement;
    const theme = THEMES.find((t) => t.id === id) || THEMES[0];
    
    // Apply theme tokens
    const tokens = id === "custom" ? { ...theme.tokens, ...custom } : theme.tokens;
    
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Handle dark class for Tailwind and other components
    if (theme.type === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const applyFonts = useCallback((fontPrefs) => {
    const root = document.documentElement;
    
    const bodyFont = FONT_PRESETS.body.find(f => f.id === fontPrefs.body)?.value || fontPrefs.body;
    const headingFont = FONT_PRESETS.heading.find(f => f.id === fontPrefs.heading)?.value || fontPrefs.heading;
    const monoFont = FONT_PRESETS.monospace.find(f => f.id === fontPrefs.monospace)?.value || fontPrefs.monospace;

    root.style.setProperty("--font-body", bodyFont);
    root.style.setProperty("--font-heading", headingFont);
    root.style.setProperty("--font-mono", monoFont);
    
    // Also update body style directly if needed (though CSS variables are better)
    document.body.style.fontFamily = bodyFont;
  }, []);

  // --- Actions ---
  const setTheme = (id) => {
    setThemeId(id);
    localStorage.setItem("themeId", id);
  };

  const toggleTheme = () => {
    const nextTheme = themeId === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const setFonts = (newFonts) => {
    const updated = { ...fonts, ...newFonts };
    setFontsState(updated);
    localStorage.setItem("fonts", JSON.stringify(updated));
  };

  const setCustomColors = (colors) => {
    const updated = { ...customColors, ...colors };
    setCustomColorsState(updated);
    localStorage.setItem("customColors", JSON.stringify(updated));
    if (themeId === "custom") {
      applyTheme("custom", updated);
    }
  };

  const resetToDefault = () => {
    setTheme("light");
    const defaultFonts = {
      body: "manrope",
      heading: "manrope",
      monospace: "jetbrains-mono",
    };
    setFonts(defaultFonts);
    setCustomColorsState({});
    localStorage.removeItem("customColors");
  };

  // --- Effects ---
  useEffect(() => {
    applyTheme(themeId, customColors);
  }, [themeId, customColors, applyTheme]);

  useEffect(() => {
    applyFonts(fonts);
  }, [fonts, applyFonts]);

  // Sync with system theme if configured (optional addition)
  useEffect(() => {
    if (themeId === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e) => {
        applyTheme(e.matches ? "dark" : "light");
      };
      
      applyTheme(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeId, applyTheme]);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme: themeId, 
        setTheme, 
        toggleTheme, 
        fonts, 
        setFonts, 
        customColors, 
        setCustomColors,
        resetToDefault,
        themes: THEMES,
        fontPresets: FONT_PRESETS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
