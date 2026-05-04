// CineMatch mobile primitives — touch-first, no sidebar
const { useState: muS, useEffect: muE } = React;

// === Star rating (mono) ===
function MStars({ value, size = 11 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const chars = "★".repeat(full) + (half ? "½" : "") + "·".repeat(empty);
  return <span style={{ fontSize: size, fontFamily: "var(--font-mono)", color: "var(--amber-400)", letterSpacing: "0.05em" }}>{chars}</span>;
}

// === Mobile-tuned poster placeholder ===
function MPoster({ title, year, ratio = "2 / 3", style = {}, big = false }) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffff;
  const hue = (h % 60) - 30;
  return (
    <div style={{
      aspectRatio: ratio,
      width: "100%",
      borderRadius: 6,
      overflow: "hidden",
      position: "relative",
      backgroundImage: "repeating-linear-gradient(45deg, var(--ink-700) 0, var(--ink-700) 8px, var(--ink-750) 8px, var(--ink-750) 16px)",
      filter: `hue-rotate(${hue}deg)`,
      boxShadow: "0 12px 28px -10px rgba(0,0,0,0.7)",
      ...style,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: big ? 14 : 8,
        background: "linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.85) 100%)",
      }}>
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic",
          color: "var(--bone-100)",
          fontSize: big ? 22 : 12, lineHeight: 1.05,
          letterSpacing: "-0.01em",
        }}>{title}</div>
        {year && big && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", marginTop: 4, letterSpacing: "0.1em" }}>{year}</div>
        )}
      </div>
      <div style={{
        position: "absolute", top: 6, right: 6,
        fontFamily: "var(--font-mono)", fontSize: 7,
        color: "var(--bone-500)", letterSpacing: "0.2em",
      }}>POSTER</div>
    </div>
  );
}

// === Mobile match badge ===
function MMatch({ score }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 10,
      letterSpacing: "0.05em", color: "var(--amber-300)",
      border: "1px solid var(--amber-700)",
      background: "rgba(180, 110, 40, 0.1)",
      padding: "2px 6px", borderRadius: 3,
      whiteSpace: "nowrap",
    }}>{Math.round(score * 100)}%</span>
  );
}

// === Mobile screen shell — handles status bar offset, scroll, footer nav ===
function MobileShell({ children, footerActive = "feed", onTab, hideFooter, headerOverlay }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--ink-900)",
      color: "var(--bone-200)",
      display: "flex", flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      {headerOverlay}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        paddingBottom: hideFooter ? 0 : 88,
      }}>
        {children}
      </div>
      {!hideFooter && <MFooterNav active={footerActive} onTab={onTab} />}
    </div>
  );
}

// === Footer tab bar ===
function MFooterNav({ active, onTab }) {
  const tabs = [
    { id: "feed", label: "Picks", icon: "▶" },
    { id: "upcoming", label: "Soon", icon: "◷" },
    { id: "taste", label: "Taste", icon: "◉" },
    { id: "diary", label: "Diary", icon: "❍" },
    { id: "settings", label: "More", icon: "⋯" },
  ];
  return (
    <nav style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      paddingBottom: 24, paddingTop: 8,
      background: "linear-gradient(180deg, transparent 0%, var(--ink-900) 30%)",
      display: "flex",
      justifyContent: "space-around",
      borderTop: "var(--hairline-soft)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab && onTab(t.id)} style={{
          background: "transparent", border: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 2,
          padding: "8px 12px",
          color: active === t.id ? "var(--bone-100)" : "var(--bone-500)",
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}>
          <span style={{ fontSize: 18, color: active === t.id ? "var(--amber-400)" : "var(--bone-500)" }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// === Top header (status-bar safe) ===
function MHeader({ eyebrow, title, right, sticky }) {
  return (
    <header style={{
      padding: "60px 20px 16px",
      position: sticky ? "sticky" : "static",
      top: 0,
      background: "var(--ink-900)",
      zIndex: 5,
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <h1 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
          fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1.05,
          color: "var(--bone-100)", margin: 0,
        }}>{title}</h1>
      </div>
      {right}
    </header>
  );
}

// === Reason chip (compact for mobile) ===
function MReason({ reason, basis }) {
  const labels = { director: "Dir", genre: "Gen", similar: "Sim" };
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 9,
      letterSpacing: "0.08em", textTransform: "uppercase",
      color: "var(--bone-300)",
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ color: "var(--amber-400)" }}>·</span>
      <span style={{ color: "var(--bone-500)" }}>{labels[reason] || reason}</span>
      <span style={{ color: "var(--bone-200)" }}>{basis}</span>
    </span>
  );
}

Object.assign(window, { MStars, MPoster, MMatch, MobileShell, MFooterNav, MHeader, MReason });
