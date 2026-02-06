import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { THEMES, FONT_PRESETS } from "@/constants/themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  RotateCcw, 
  Type, 
  Palette, 
  Moon, 
  Sun, 
  Monitor,
  Layout,
  MousePointer2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

const AppearanceSettings = () => {
  const { 
    theme, 
    setTheme, 
    fonts, 
    setFonts, 
    themes, 
    fontPresets, 
    resetToDefault,
    customColors,
    setCustomColors
  } = useTheme();

  const [activeTab, setActiveTab] = useState("themes");
  const [filter, setFilter] = useState("all");

  const handleFontChange = (type, value) => {
    setFonts({ [type]: value });
  };

  const handleCustomColorChange = (key, value) => {
    setCustomColors({ [key]: value });
  };

  const applyRandomTheme = () => {
    const eligibleThemes = themes.filter(t => t.id !== 'system' && t.id !== 'custom');
    const randomTheme = eligibleThemes[Math.floor(Math.random() * eligibleThemes.length)];
    setTheme(randomTheme.id);
  };

  const filteredThemes = themes.filter(t => {
    if (filter === "all") return true;
    if (filter === "light") return t.type === "light";
    if (filter === "dark") return t.type === "dark";
    if (filter === "luxury") return ["champagne", "midnight-gold", "slate-luxury", "ebony-silver", "royal-velvet"].includes(t.id);
    if (filter === "soft") return ["soft-lavender", "sage-serenity", "rose-quartz", "pastel"].includes(t.id);
    return true;
  });

  return (
    <div className="w-full py-8 space-y-12 animate-in fade-in duration-500 px-4 sm:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Appearance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Customize your workspace with high-end typography and curated color palettes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={applyRandomTheme}
            className="rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all"
          >
            <Palette className="w-4 h-4 text-purple-500" />
            Surprise Me
          </Button>
          <Button 
            variant="outline" 
            onClick={resetToDefault}
            className="rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
        {/* Sidebar Tabs */}
        <aside className="space-y-6">
          <div className="space-y-1">
            <label className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation</label>
            {[
              { id: "themes", label: "Color Palettes", icon: Palette },
              { id: "fonts", label: "Typography", icon: Type },
              { id: "custom", label: "Custom Studio", icon: Layout },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl shadow-slate-200 dark:shadow-none translate-x-1" 
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:translate-x-1"
                )}
              >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "opacity-100" : "opacity-50")} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "themes" && (
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <label className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Filters</label>
              <div className="flex flex-wrap gap-2 px-2">
                {[
                  { id: "all", label: "All" },
                  { id: "luxury", label: "Luxurious" },
                  { id: "soft", label: "Soft" },
                  { id: "light", label: "Light" },
                  { id: "dark", label: "Dark" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border",
                      filter === f.id 
                        ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20" 
                        : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="min-h-[600px]">
          {activeTab === "themes" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredThemes.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "group relative cursor-pointer rounded-[2rem] border-2 transition-all duration-500 overflow-hidden",
                    theme === t.id 
                      ? "border-blue-500 ring-8 ring-blue-500/5 shadow-2xl scale-[1.02] z-10" 
                      : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:translate-y-[-4px]"
                  )}
                  style={t.id === "system" ? {} : {
                    backgroundColor: `hsl(${t.tokens["--background"]})`,
                    color: `hsl(${t.tokens["--foreground"]})`
                  }}
                >
                  {/* Luxury Badge */}
                  {["champagne", "midnight-gold", "slate-luxury", "ebony-silver", "royal-velvet"].includes(t.id) && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-amber-400/20 backdrop-blur-md border border-amber-400/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                        Luxury
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "p-6 space-y-4",
                    t.id === "system" && "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 h-full flex flex-col justify-center items-center py-12"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t.name}</span>
                      {theme === t.id && (
                        <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg shadow-blue-500/40">
                          <Check className="w-3.5 h-3.5 stroke-[4px]" />
                        </div>
                      )}
                    </div>
                    
                    {/* Theme Preview Blocks */}
                    {t.id === "system" ? (
                      <Monitor className="w-12 h-12 opacity-20 animate-pulse" />
                    ) : (
                      <div className="space-y-3">
                        <div 
                          className="h-10 rounded-2xl w-full flex items-center px-4 shadow-sm"
                          style={{ backgroundColor: `hsl(${t.tokens["--primary"]})` }}
                        >
                          <div className="h-1.5 w-16 rounded-full opacity-50" style={{ backgroundColor: `hsl(${t.tokens["--primary-foreground"]})` }} />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-full rounded-xl opacity-10" style={{ backgroundColor: `hsl(${t.tokens["--foreground"]})` }} />
                          <div className="h-8 w-full rounded-xl opacity-20" style={{ backgroundColor: `hsl(${t.tokens["--foreground"]})` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Theme Badge */}
                  <div className="absolute bottom-4 left-6 opacity-40 group-hover:opacity-100 transition-opacity">
                    {t.id === "system" ? null : 
                     t.type === "dark" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "fonts" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-dashed">
                <CardHeader className="p-10 pb-6 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-500">
                    <Type className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight">Master Typography</CardTitle>
                  <CardDescription className="text-base font-medium">Fine-tune the reading experience across your entire workspace.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-12">
                  {/* Body Font */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800" />
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-background px-4">Interface Font</label>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {fontPresets.body.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => handleFontChange("body", f.id)}
                          className={cn(
                            "p-6 rounded-3xl border-2 transition-all text-left group relative hover:translate-y-[-2px]",
                            fonts.body === f.id 
                              ? "border-blue-500 bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10" 
                              : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
                          )}
                          style={{ fontFamily: f.value }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-black">{f.name}</span>
                            {fonts.body === f.id && <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                            Crafting premium experiences with elegant type.
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Heading Font */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800" />
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-background px-4">Heading Font</label>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {fontPresets.heading.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => handleFontChange("heading", f.id)}
                          className={cn(
                            "p-6 rounded-3xl border-2 transition-all text-left group relative hover:translate-y-[-2px]",
                            fonts.heading === f.id 
                              ? "border-emerald-500 bg-white dark:bg-slate-900 shadow-xl shadow-emerald-500/10" 
                              : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
                          )}
                          style={{ fontFamily: f.value }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-black">{f.name}</span>
                            {fonts.heading === f.id && <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                          </div>
                          <span className="text-2xl font-black leading-none tracking-tight">Aa Bb</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "custom" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <Card className="border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-dashed">
                <CardHeader className="p-10 pb-6">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center text-purple-500 mb-6">
                    <Layout className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight">Custom Studio</CardTitle>
                  <CardDescription className="text-base font-medium">Design your own signature theme. Your imagination is the only limit.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Accent</label>
                        <span className="text-[10px] font-mono text-slate-400">HSL FORMAT</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            value={customColors["--primary"] || "240 5.9% 10%"} 
                            onChange={(e) => handleCustomColorChange("--primary", e.target.value)}
                            className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm shadow-inner transition-all focus:border-purple-500 focus:ring-0"
                            placeholder="H S% L%"
                          />
                        </div>
                        <div 
                          className="w-14 h-14 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl"
                          style={{ backgroundColor: `hsl(${customColors["--primary"] || "240 5.9% 10%"})` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Canvas Base</label>
                        <span className="text-[10px] font-mono text-slate-400">HSL FORMAT</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            value={customColors["--background"] || "0 0% 100%"} 
                            onChange={(e) => handleCustomColorChange("--background", e.target.value)}
                            className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm shadow-inner transition-all focus:border-purple-500 focus:ring-0"
                            placeholder="H S% L%"
                          />
                        </div>
                        <div 
                          className="w-14 h-14 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl shadow-inner"
                          style={{ backgroundColor: `hsl(${customColors["--background"] || "0 0% 100%"})` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-100 dark:border-purple-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-purple-500/10 transition-all duration-700" />
                    <div className="relative flex gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                        <MousePointer2 className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-base font-black text-purple-900 dark:text-purple-100">Designer Tip</p>
                        <p className="text-sm text-purple-700/80 dark:text-purple-300/80 leading-relaxed font-medium">
                          Try <span className="font-mono text-xs font-black bg-purple-100 dark:bg-purple-900/40 px-1 rounded">210 100% 50%</span> for a vibrant Azure or <span className="font-mono text-xs font-black bg-purple-100 dark:bg-purple-900/40 px-1 rounded">0 0% 10%</span> for a deep Coal.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setTheme("custom")}
                    className={cn(
                      "w-full h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-500",
                      theme === "custom" 
                        ? "bg-purple-600 hover:bg-purple-700 shadow-2xl shadow-purple-500/40 ring-4 ring-purple-500/10 text-white" 
                        : "bg-slate-900 dark:bg-white dark:text-slate-900 hover:shadow-xl"
                    )}
                  >
                    {theme === "custom" ? "ACTIVE STUDIO SESSION" : "ACTIVATE STUDIO THEME"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Persistence Info */}
      <div className="pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
        <div className="flex items-center gap-3">
          <Monitor className="w-3 h-3" />
          Real-time cloud sync active
        </div>
        <div className="flex gap-4">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
