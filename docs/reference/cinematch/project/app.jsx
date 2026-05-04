// CineMatch app shell — composes views, owns top-level state + tweaks
const { useState: useS, useEffect: useE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "amber",
  "density": "grid",
  "showSetup": false
}/*EDITMODE-END*/;

const ACCENTS = {
  amber:    { 300: "oklch(0.86 0.12 70)",  400: "oklch(0.78 0.15 65)",  500: "oklch(0.72 0.17 60)",  600: "oklch(0.62 0.16 55)",  700: "oklch(0.52 0.14 50)" },
  crimson:  { 300: "oklch(0.78 0.16 25)",  400: "oklch(0.70 0.19 22)",  500: "oklch(0.62 0.21 20)",  600: "oklch(0.54 0.19 18)",  700: "oklch(0.44 0.17 16)" },
  jade:     { 300: "oklch(0.84 0.12 155)", 400: "oklch(0.76 0.14 150)", 500: "oklch(0.68 0.15 148)", 600: "oklch(0.58 0.14 145)", 700: "oklch(0.48 0.12 142)" },
  electric: { 300: "oklch(0.84 0.13 240)", 400: "oklch(0.76 0.16 235)", 500: "oklch(0.68 0.18 232)", 600: "oklch(0.58 0.16 228)", 700: "oklch(0.48 0.14 225)" },
};

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useS("feed");
  const [openFilm, setOpenFilm] = useS(null);
  const [showSetup, setShowSetup] = useS(false);
  const data = window.CINEMATCH_DATA;

  // Apply theme + accent to root
  useE(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
    const a = ACCENTS[tweaks.accent] || ACCENTS.amber;
    Object.entries(a).forEach(([k, v]) => {
      document.documentElement.style.setProperty(`--amber-${k}`, v);
    });
  }, [tweaks.theme, tweaks.accent]);

  const renderView = () => {
    switch (view) {
      case "feed":     return <FeedView data={data} density={tweaks.density} onOpenFilm={setOpenFilm} />;
      case "upcoming": return <UpcomingView data={data} onOpenFilm={setOpenFilm} />;
      case "taste":    return <TasteView data={data} />;
      case "diary":    return <DiaryView data={data} />;
      case "settings": return <SettingsView data={data} />;
      default:         return null;
    }
  };

  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar view={view} setView={setView} onOpenSetup={() => setShowSetup(true)} />
        <main data-screen-label={`${view}`} style={{
          flex: 1,
          padding: "56px 56px 96px",
          maxWidth: 1280,
          width: "100%",
        }}>
          {renderView()}
        </main>
      </div>

      {openFilm && <DetailView film={openFilm} allRecs={data.recommendations} onClose={() => setOpenFilm(null)} />}
      {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection title="Appearance">
          <TweakRadio
            label="Theme"
            value={tweaks.theme}
            options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]}
            onChange={v => setTweak("theme", v)}
          />
          <TweakSelect
            label="Accent color"
            value={tweaks.accent}
            options={[
              { value: "amber", label: "Projector amber" },
              { value: "crimson", label: "Marquee crimson" },
              { value: "jade", label: "Celluloid jade" },
              { value: "electric", label: "Electric blue" },
            ]}
            onChange={v => setTweak("accent", v)}
          />
        </TweakSection>
        <TweakSection title="Layout">
          <TweakRadio
            label="Recommendations density"
            value={tweaks.density}
            options={[
              { value: "sparse", label: "Sparse" },
              { value: "grid", label: "Grid" },
              { value: "list", label: "List" },
            ]}
            onChange={v => setTweak("density", v)}
          />
        </TweakSection>
        <TweakSection title="Flows">
          <TweakButton label="Open first-time setup" onClick={() => setShowSetup(true)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
