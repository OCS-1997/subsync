import React from "react";

export function ThemeToggle() {
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("dark")
  );

  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  React.useEffect(() => {
    // On mount, respect saved theme
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDark(true);
    if (saved === "light") setDark(false);
  }, []);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setDark((v) => !v)}
      className="p-2 rounded bg-secondary hover:bg-accent transition"
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}