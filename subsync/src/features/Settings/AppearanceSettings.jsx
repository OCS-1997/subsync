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
  Trash2,
  Zap,
  BoxSelect,
  Layers,
  Move,
  Pipette
} from "lucide-react";
import { cn, hexToHSL, hslToHex } from "@/lib/utils";

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
    setCustomColors,
    appearance,
    setAppearance
  } = useTheme();

  const [activeTab, setActiveTab] = useState("themes");
  const [filter, setFilter] = useState("all");

  const handleFontChange = (type, value) => {
    setFonts({ [type]: value });
  };

  const handleCustomColorChange = (key, value) => {
    setCustomColors({ [key]: value });
  };

  const handleAppearanceChange = (key, value) => {
    setAppearance({ [key]: value });
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
    if (filter === "soft") return ["soft-lavender", "sage-serenity", "rose-quartz", "pastel", "nordic-frost"].includes(t.id);
    if (filter === "special") return ["cyberpunk", "retrowave", "retro-crt", "dracula", "tokyo-night"].includes(t.id);
    if (filter === "earthy") return ["forest-deep", "sage-serenity", "barista", "everforest", "gruvbox-dark"].includes(t.id);
    return true;
  });

  const customColorFields = [
    { key: "--primary", label: "Primary Accent", desc: "Main branding color" },
    { key: "--background", label: "Background", desc: "Main app background" },
    { key: "--card", label: "Card & Surface", desc: "Background for components" },
    { key: "--sidebar-background", label: "Sidebar", desc: "Fixed navigation panel" },
    { key: "--border", label: "Border & Stroke", desc: "Subtle lines and dividers" },
    { key: "--foreground", label: "Base Text", desc: "Primary content color" },
  ];

  return (
    <div className="w-full py-8 space-y-12 animate-in fade-in duration-500 px-4 sm:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground">Appearance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Customize your workspace with high-end typography and curated color palettes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={applyRandomTheme}
            className="rounded-xl font-bold gap-2 border-border bg-card shadow-sm hover:shadow-md transition-all"
          >
            <Palette className="w-4 h-4 text-primary" />
            Surprise Me
          </Button>
          <Button 
            variant="outline" 
            onClick={resetToDefault}
            className="rounded-xl font-bold gap-2 border-border bg-card"
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
              { id: "interface", label: "Interface", icon: BoxSelect },
              { id: "layout", label: "Layout", icon: Layout },
              { id: "behavior", label: "Behavior", icon: Zap },
              { id: "custom", label: "Custom Studio", icon: MousePointer2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground shadow-xl translate-x-1" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
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
                  { id: "luxury", label: "Luxury" },
                  { id: "special", label: "Cyber" },
                  { id: "earthy", label: "Nature" },
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
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
                        : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeTab === "interface" && (
            <div className="space-y-4 pt-6 text-center">
               <div className="mx-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[var(--radius)] border border-slate-200 dark:border-slate-800 space-y-4 transition-all duration-300 shadow-[var(--shadow-strength)_0_10px_15px_-3px_rgb(0_0_0_/_0.1)]">
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-400/80" />
                   <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                   <div className="w-3 h-3 rounded-full bg-green-400/80" />
                 </div>
                 <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                 <div className="space-y-2">
                   <div className="h-8 w-full bg-blue-500 rounded-[calc(var(--radius)*0.8)] shadow-sm flex items-center justify-center text-[10px] text-white font-bold opacity-90">
                     Button
                   </div>
                 </div>
               </div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Live Preview</p>
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
                      ? "border-primary ring-8 ring-primary/5 shadow-2xl scale-[1.02] z-10" 
                      : "border-border hover:border-muted-foreground hover:shadow-xl hover:translate-y-[-4px]"
                  )}
                  style={t.id === "system" ? {} : {
                    backgroundColor: `hsl(${t.tokens["--background"]})`,
                    color: `hsl(${t.tokens["--foreground"]})`
                  }}
                >
                  {/* Theme Badges */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                    {["champagne", "midnight-gold", "slate-luxury", "ebony-silver", "royal-velvet"].includes(t.id) && (
                      <div className="bg-amber-400/20 backdrop-blur-md border border-amber-400/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                        Luxury
                      </div>
                    )}
                    {["cyberpunk", "retrowave", "retro-crt"].includes(t.id) && (
                      <div className="bg-pink-500/20 backdrop-blur-md border border-pink-500/30 text-pink-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ring-4 ring-pink-500/5">
                        Cyber
                      </div>
                    )}
                    {["forest-deep", "sage-serenity", "everforest"].includes(t.id) && (
                      <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                        Nature
                      </div>
                    )}
                    {["retro-crt", "barista"].includes(t.id) && (
                      <div className="bg-orange-500/20 backdrop-blur-md border border-orange-500/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                        Vintage
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "p-6 space-y-4",
                    t.id === "system" && "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 h-full flex flex-col justify-center items-center py-12"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t.name}</span>
                      {theme === t.id && (
                        <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-lg shadow-primary/40">
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
                  <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
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
                              ? "border-primary bg-card shadow-xl shadow-primary/10" 
                              : "border-border hover:border-muted-foreground bg-accent/30"
                          )}
                          style={{ fontFamily: f.value }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-black">{f.name}</span>
                            {fonts.body === f.id && <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />}
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
                              ? "border-primary bg-card shadow-xl shadow-primary/10" 
                              : "border-border hover:border-muted-foreground bg-accent/30"
                          )}
                          style={{ fontFamily: f.value }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-black">{f.name}</span>
                            {fonts.heading === f.id && <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />}
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



          {activeTab === "interface" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {/* Corner Radius */}
              <Card className="border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                <CardHeader className="p-10 pb-6">
                  <CardTitle className="text-xl font-black">Corner Radius</CardTitle>
                  <CardDescription>Define the curvature of your interface elements.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "Sharp", value: "0px", class: "rounded-none" },
                      { label: "Slight", value: "0.25rem", class: "rounded" },
                      { label: "Standard", value: "0.5rem", class: "rounded-lg" },
                      { label: "Round", value: "1rem", class: "rounded-2xl" },
                      { label: "Pill", value: "9999px", class: "rounded-full" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAppearanceChange("radius", opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                          appearance.radius === opt.value 
                            ? "border-primary bg-primary/10" 
                            : "border-transparent"
                        )}
                      >
                        <div className={cn("w-12 h-12 bg-primary shadow-lg shadow-primary/30", opt.class)} />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shadows */}
              <Card className="border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                <CardHeader className="p-10 pb-6">
                  <CardTitle className="text-xl font-black">Depth & Shadows</CardTitle>
                  <CardDescription>Control the elevation intensity of cards and modals.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                      { label: "Flat", value: "none", shadow: "none" },
                      { label: "Subtle", value: "subtle", shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
                      { label: "Medium", value: "medium", shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
                      { label: "Deep", value: "deep", shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAppearanceChange("shadowDepth", opt.value)}
                        className={cn(
                          "group p-6 rounded-2xl border-2 transition-all text-left",
                          appearance.shadowDepth === opt.value 
                            ? "border-primary bg-card" 
                            : "border-border bg-accent/30"
                        )}
                      >
                         <div className="h-16 bg-white dark:bg-slate-700 rounded-lg mb-4 mx-auto w-full transition-shadow duration-300" style={{ boxShadow: opt.shadow }} />
                         <div className="text-center font-bold text-sm">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "layout" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               {/* Sidebar Style */}
              <Card className="border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                <CardHeader className="p-10 pb-6">
                  <CardTitle className="text-xl font-black">Sidebar Style</CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {[
                      { id: "default", label: "Default", desc: "Full height, attached to edge." },
                      { id: "floating", label: "Floating", desc: "Detached panel with spacing." },
                      { id: "inset", label: "Inset", desc: "MacOS style layout." },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => handleAppearanceChange("sidebarStyle", style.id)}
                        className={cn(
                          "relative p-6 rounded-3xl border-2 transition-all text-left hover:bg-accent flex flex-col gap-4",
                          appearance.sidebarStyle === style.id ? "border-primary bg-primary/10" : "border-border"
                        )}
                      >
                        <div className="h-24 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden relative border border-border w-full">
                           {/* Mini Mockup */}
                           <div className={cn(
                             "absolute top-0 bottom-0 w-8 bg-primary transition-all",
                             style.id === "default" && "left-0",
                             style.id === "floating" && "left-2 top-2 bottom-2 rounded-md",
                             style.id === "inset" && "left-2 top-2 bottom-2 rounded-l-md"
                           )} />
                           <div className={cn(
                             "absolute bg-card transition-all",
                             style.id === "default" && "left-8 top-0 bottom-0 right-0",
                             style.id === "floating" && "left-12 top-2 bottom-2 right-2 rounded-md",
                             style.id === "inset" && "left-10 top-2 bottom-2 right-2 rounded-r-md"
                           )} />
                        </div>
                        <div>
                          <div className="font-bold">{style.label}</div>
                          <div className="text-xs text-slate-500">{style.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Density */}
              <Card className="border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                 <CardHeader className="p-10 pb-6">
                  <CardTitle className="text-xl font-black">Interface Density</CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                   <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                     {[0.8, 1, 1.2].map((d, i) => {
                       const labels = ["Compact", "Comfortable", "Spacious"];
                       return (
                         <button
                           key={d}
                           onClick={() => handleAppearanceChange("density", d)}
                           className={cn(
                             "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                             appearance.density === d 
                               ? "bg-card shadow-sm text-primary" 
                               : "text-muted-foreground hover:text-foreground"
                           )}
                         >
                           {labels[i]}
                         </button>
                       );
                     })}
                   </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "behavior" && (
             <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <Card className="border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                <CardHeader className="p-10 pb-6">
                  <CardTitle className="text-xl font-black">Motion & Feedback</CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8">
                  <div className="space-y-4">
                     <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Animation Speed</label>
                     <div className="grid grid-cols-4 gap-4">
                        {[
                          { id: "none", label: "Off" },
                          { id: "fast", label: "Fast" },
                          { id: "normal", label: "Normal" },
                          { id: "slow", label: "Slow" },
                        ].map((s) => (
                           <button
                             key={s.id}
                             onClick={() => handleAppearanceChange("animationSpeed", s.id)}
                             className={cn(
                               "py-4 rounded-2xl border-2 font-bold transition-all",
                               appearance.animationSpeed === s.id 
                                 ? "border-primary bg-primary/10 text-primary" 
                                 : "border-border hover:border-muted-foreground"
                             )}
                           >
                             {s.label}
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
                  <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
                    <Layout className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight">Custom Studio</CardTitle>
                  <CardDescription className="text-base font-medium">Design your own signature theme. Your imagination is the only limit.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {customColorFields.map((field) => (
                      <div key={field.key} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</label>
                          <span className="text-[8px] font-mono text-slate-400">HSL FORMAT</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input 
                              type="text" 
                              value={customColors[field.key] || "0 0% 0%"} 
                              onChange={(e) => handleCustomColorChange(field.key, e.target.value)}
                              className="w-full h-12 px-4 rounded-xl border border-border bg-card font-mono text-xs shadow-inner transition-all focus:border-primary focus:ring-0"
                              placeholder="H S% L%"
                            />
                            <div className="absolute right-2 top-2 bottom-2">
                               <div className="relative w-8 h-8">
                                 <input 
                                   type="color"
                                   value={hslToHex(customColors[field.key] || "0 0% 100%")}
                                   onChange={(e) => handleCustomColorChange(field.key, hexToHSL(e.target.value))}
                                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                 />
                                 <div className="w-full h-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                   <Pipette className="w-4 h-4 text-slate-500" />
                                 </div>
                               </div>
                            </div>
                          </div>
                          <div 
                            className="w-12 h-12 rounded-xl border-2 border-white dark:border-slate-800 shadow-lg shrink-0 transition-colors duration-300"
                            style={{ backgroundColor: `hsl(${customColors[field.key] || "0 0% 100%"})` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 italic font-medium">{field.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-all duration-700" />
                    <div className="relative flex gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center shadow-sm">
                        <MousePointer2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-base font-black text-foreground">Designer Tip</p>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                          Try <span className="font-mono text-xs font-black bg-primary/10 px-1 rounded">210 100% 50%</span> for a vibrant Azure or <span className="font-mono text-xs font-black bg-primary/10 px-1 rounded">0 0% 10%</span> for a deep Coal.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setTheme("custom")}
                    className={cn(
                      "w-full h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-500",
                      theme === "custom" 
                        ? "bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 ring-4 ring-primary/10 text-primary-foreground" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-xl"
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
