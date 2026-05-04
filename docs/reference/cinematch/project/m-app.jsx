// CineMatch mobile app — composes screens into iOS frames on a design canvas
const { useState: maS } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "amber",
  "live": "feed"
}/*EDITMODE-END*/;

const ACCENTS = {
  amber:    { 300: "oklch(0.86 0.12 70)",  400: "oklch(0.78 0.15 65)",  500: "oklch(0.72 0.17 60)",  600: "oklch(0.62 0.16 55)",  700: "oklch(0.52 0.14 50)" },
  crimson:  { 300: "oklch(0.78 0.16 25)",  400: "oklch(0.70 0.19 22)",  500: "oklch(0.62 0.21 20)",  600: "oklch(0.54 0.19 18)",  700: "oklch(0.44 0.17 16)" },
  jade:     { 300: "oklch(0.84 0.12 155)", 400: "oklch(0.76 0.14 150)", 500: "oklch(0.68 0.15 148)", 600: "oklch(0.58 0.14 145)", 700: "oklch(0.48 0.12 142)" },
  electric: { 300: "oklch(0.84 0.13 240)", 400: "oklch(0.76 0.16 235)", 500: "oklch(0.68 0.18 232)", 600: "oklch(0.58 0.16 228)", 700: "oklch(0.48 0.14 225)" },
};

// Helper: place a screen inside an iOS device frame
function MFrame({ children, label }) {
  return (
    <IOSDevice width={390} height={844} dark>
      {children}
    </IOSDevice>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [openFilm, setOpenFilm] = maS(null);
  const [mode, setMode] = maS("canvas"); // "canvas" or "live"
  const [liveTab, setLiveTab] = maS(tweaks.live || "feed");
  const data = window.CINEMATCH_DATA;

  React.useEffect(() => {
    const a = ACCENTS[tweaks.accent] || ACCENTS.amber;
    Object.entries(a).forEach(([k, v]) => {
      document.documentElement.style.setProperty(`--amber-${k}`, v);
    });
  }, [tweaks.accent]);

  // === LIVE MODE: single full-bleed phone-sized viewport ===
  if (mode === "live") {
    const renderLive = () => {
      switch (liveTab) {
        case "feed":     return <MFeedScreen data={data} onOpenFilm={f => setOpenFilm(f)} />;
        case "upcoming": return <MUpcomingScreen data={data} onTab={setLiveTab} onOpenFilm={f => setOpenFilm(f)} />;
        case "taste":    return <MTasteScreen data={data} onTab={setLiveTab} />;
        case "diary":    return <MDiaryScreen data={data} onTab={setLiveTab} />;
        case "settings": return (
          <MobileShell footerActive="settings" onTab={setLiveTab}>
            <MHeader eyebrow="Connections + data" title="More" />
            <div style={{ padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                ["Letterboxd", "@manuelmatheu", "ok"],
                ["TMDB token", "•••• Mxng", "ok"],
                ["CSV history", "847 films", "ok"],
                ["Region", "Argentina", "ok"],
                ["Cache", "412 films · 24h TTL", "info"],
                ["Taste profile", "Recomputed 12m ago", "ok"],
              ].map(([l, v, s]) => (
                <div key={l} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 0", borderBottom: "var(--hairline-soft)",
                }}>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>{l}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "var(--bone-100)" }}>{v}</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-400)" }}>›</span>
                </div>
              ))}
              <button onClick={() => { setLiveTab("setup"); }} style={{
                marginTop: 24,
                background: "transparent", color: "var(--bone-200)",
                border: "var(--hairline)", padding: "14px",
                fontFamily: "var(--font-mono)", fontSize: 11,
                letterSpacing: "0.1em", textTransform: "uppercase",
                borderRadius: 6,
              }}>Re-run setup</button>
            </div>
          </MobileShell>
        );
        case "setup":    return <MSetupScreen step={1} onClose={() => setLiveTab("settings")} />;
        default:         return null;
      }
    };
    return (
      <>
        <div style={{
          width: "100vw", height: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#000",
        }}>
          <div style={{ width: "min(420px, 100vw)", height: "min(900px, 100vh)" }}>
            {renderLive()}
          </div>
        </div>
        {openFilm && (
          <div style={{ position: "fixed", inset: 0, zIndex: 80, width: "min(420px, 100vw)", height: "min(900px, 100vh)", margin: "auto" }}>
            <MDetailScreen film={openFilm} onClose={() => setOpenFilm(null)} />
          </div>
        )}
        {renderTweaks()}
      </>
    );
  }

  // === CANVAS MODE: all screens side by side ===
  function renderTweaks() {
    return (
      <TweaksPanel title="Tweaks">
        <TweakSection title="View">
          <TweakRadio
            label="Mode"
            value={mode}
            options={[
              { value: "canvas", label: "Canvas" },
              { value: "live",   label: "Live phone" },
            ]}
            onChange={setMode}
          />
          {mode === "live" && (
            <TweakSelect
              label="Live screen"
              value={liveTab}
              options={[
                { value: "feed",     label: "Feed" },
                { value: "upcoming", label: "Coming Soon" },
                { value: "taste",    label: "Taste" },
                { value: "diary",    label: "Diary" },
                { value: "settings", label: "More" },
                { value: "setup",    label: "Onboarding" },
              ]}
              onChange={v => { setLiveTab(v); setTweak("live", v); }}
            />
          )}
        </TweakSection>
        <TweakSection title="Theme">
          <TweakSelect
            label="Accent"
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
      </TweaksPanel>
    );
  }

  return (
    <>
      <DesignCanvas title="CineMatch · mobile" subtitle="Editorial neo-noir, mobile-first. Tap any screen to focus.">
        <DCSection id="primary" title="Primary flow">
          <DCArtboard id="feed" label="01 Feed · Tonight's pick + rails + grid" width={390} height={844} data-screen-label="01 Feed">
            <MFeedScreen data={data} onOpenFilm={f => setOpenFilm(f)} />
          </DCArtboard>
          <DCArtboard id="detail" label="02 Film detail · why-recommended" width={390} height={844} data-screen-label="02 Detail">
            <MDetailScreen film={data.hero} onClose={() => {}} />
          </DCArtboard>
          <DCArtboard id="upcoming" label="03 Coming Soon" width={390} height={844} data-screen-label="03 Upcoming">
            <MUpcomingScreen data={data} onOpenFilm={f => setOpenFilm(f)} />
          </DCArtboard>
        </DCSection>

        <DCSection id="profile" title="Taste & history">
          <DCArtboard id="taste" label="04 Taste profile" width={390} height={844} data-screen-label="04 Taste">
            <MTasteScreen data={data} />
          </DCArtboard>
          <DCArtboard id="diary" label="05 Recent diary (RSS live)" width={390} height={844} data-screen-label="05 Diary">
            <MDiaryScreen data={data} />
          </DCArtboard>
        </DCSection>

        <DCSection id="onboarding" title="First-time setup (3 steps)">
          <DCArtboard id="setup-1" label="06a Setup · Letterboxd" width={390} height={844} data-screen-label="06a Setup">
            <MSetupScreen step={1} />
          </DCArtboard>
          <DCArtboard id="setup-2" label="06b Setup · TMDB token" width={390} height={844} data-screen-label="06b Setup">
            <MSetupScreen step={2} />
          </DCArtboard>
          <DCArtboard id="setup-3" label="06c Setup · CSV history" width={390} height={844} data-screen-label="06c Setup">
            <MSetupScreen step={3} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      {openFilm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }} onClick={() => setOpenFilm(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 390, height: 844, borderRadius: 48, overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          }}>
            <MDetailScreen film={openFilm} onClose={() => setOpenFilm(null)} />
          </div>
        </div>
      )}

      {renderTweaks()}

      <style>{`
        @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      `}</style>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
