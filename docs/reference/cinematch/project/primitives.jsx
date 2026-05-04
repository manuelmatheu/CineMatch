// Shared CineMatch primitives. Exports to window so other Babel scripts can use.

const { useState, useEffect, useMemo, useRef } = React;

// === Star rating renderer (mono character set) ===
function Stars({ value, size = 12 }) {
  // value is 0..5, in 0.5 steps
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const chars = "★".repeat(full) + (half ? "½" : "") + "·".repeat(empty);
  return (
    <span className="stars" style={{ fontSize: size, fontFamily: "var(--font-mono)" }}>
      {chars}
    </span>
  );
}

// === Striped placeholder poster ===
// We DON'T have real posters — the prototype uses styled placeholders, w/ title.
function PosterPlaceholder({ title, year, ratio = "2 / 3", size = "md", style = {} }) {
  // hash title -> slight color shift so they aren't all identical
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffff;
  const hue = (h % 60) - 30; // -30..30
  return (
    <div
      className="placeholder-poster"
      style={{
        aspectRatio: ratio,
        width: "100%",
        borderRadius: "var(--r-2)",
        boxShadow: "var(--shadow-poster)",
        position: "relative",
        overflow: "hidden",
        filter: `hue-rotate(${hue}deg)`,
        ...style,
      }}
    >
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: size === "sm" ? "10px" : "16px",
        background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%)",
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          color: "var(--bone-100)",
          fontSize: size === "sm" ? 14 : size === "lg" ? 28 : 18,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          textShadow: "0 2px 8px rgba(0,0,0,0.6)",
        }}>
          {title}
        </div>
        {year && (
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--bone-400)",
            marginTop: 4,
            letterSpacing: "0.1em",
          }}>
            {year}
          </div>
        )}
      </div>
      {/* Diagonal "POSTER" stamp */}
      <div style={{
        position: "absolute",
        top: 8, right: 8,
        fontFamily: "var(--font-mono)",
        fontSize: 8,
        color: "var(--bone-500)",
        letterSpacing: "0.2em",
      }}>POSTER</div>
    </div>
  );
}

// === Match score chip ===
function ScoreBadge({ score }) {
  const pct = Math.round(score * 100);
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      letterSpacing: "0.05em",
      color: "var(--amber-300)",
      border: "1px solid var(--amber-700)",
      background: "rgba(180, 110, 40, 0.08)",
      padding: "2px 6px",
      borderRadius: "var(--r-2)",
      whiteSpace: "nowrap",
    }}>
      {pct}% MATCH
    </span>
  );
}

// === Reason chip ===
function ReasonChip({ reason, basis }) {
  const labels = {
    director: "Director",
    genre: "Genre",
    similar: "Similar to",
  };
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--bone-300)",
      whiteSpace: "nowrap",
    }}>
      <span style={{ color: "var(--bone-500)" }}>{labels[reason] || reason}/</span>{" "}
      <span style={{ color: "var(--bone-200)" }}>{basis}</span>
    </span>
  );
}

// === Compact film card (grid item) ===
function FilmCard({ film, onClick, density = "grid" }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "transparent",
        border: 0,
        padding: 0,
        textAlign: "left",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        cursor: "pointer",
      }}
    >
      <div style={{
        position: "relative",
        transition: "transform var(--dur) var(--ease-out)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
      }}>
        <PosterPlaceholder title={film.title} year={film.year} />
        {/* Score sticker bottom right */}
        <div style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          opacity: hover ? 1 : 0.85,
          transition: "opacity var(--dur)",
        }}>
          <ScoreBadge score={film.score} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 2 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 17,
          lineHeight: 1.15,
          color: "var(--bone-100)",
          letterSpacing: "-0.01em",
        }}>
          {film.title}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", letterSpacing: "0.08em" }}>
          {film.director} · {film.year}
        </div>
        {film.reason && (
          <div style={{ marginTop: 4 }}>
            <ReasonChip reason={film.reason} basis={film.basis} />
          </div>
        )}
      </div>
    </button>
  );
}

// === Sidebar nav ===
function Sidebar({ view, setView, onOpenSetup }) {
  const items = [
    { id: "feed", label: "Recommendations", n: "01" },
    { id: "upcoming", label: "Coming Soon", n: "02" },
    { id: "taste", label: "Taste Profile", n: "03" },
    { id: "diary", label: "Recent Diary", n: "04" },
    { id: "settings", label: "Settings", n: "05" },
  ];
  return (
    <aside style={{
      width: 240,
      flex: "0 0 240px",
      borderRight: "var(--hairline)",
      padding: "32px 24px",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      background: "var(--ink-900)",
    }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 28,
          letterSpacing: "-0.02em",
          color: "var(--bone-100)",
          lineHeight: 1,
        }}>
          CineMatch
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--bone-500)",
          letterSpacing: "0.18em",
          marginTop: 8,
          textTransform: "uppercase",
        }}>
          A personal ledger
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              padding: "10px 8px",
              background: "transparent",
              border: 0,
              borderLeft: view === item.id ? "2px solid var(--amber-500)" : "2px solid transparent",
              marginLeft: -8,
              paddingLeft: 14,
              color: view === item.id ? "var(--bone-100)" : "var(--bone-400)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              textAlign: "left",
              transition: "color var(--dur), border-color var(--dur)",
            }}
            onMouseEnter={e => { if (view !== item.id) e.currentTarget.style.color = "var(--bone-200)"; }}
            onMouseLeave={e => { if (view !== item.id) e.currentTarget.style.color = "var(--bone-400)"; }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-500)" }}>
              {item.n}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={onOpenSetup}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
            border: "var(--hairline)",
            color: "var(--bone-300)",
            padding: "10px 12px",
            borderRadius: "var(--r-2)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>Re-import data</span>
          <span style={{ color: "var(--bone-500)" }}>↗</span>
        </button>
        <div style={{
          padding: "12px",
          border: "var(--hairline-soft)",
          borderRadius: "var(--r-2)",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-500)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            Connected as
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--bone-200)" }}>
            @manuelmatheu
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", marginTop: 4 }}>
            847 films · synced 12m ago
          </div>
        </div>
      </div>
    </aside>
  );
}

// === Section header ===
function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header style={{
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 24,
      marginBottom: 32,
      paddingBottom: 16,
      borderBottom: "var(--hairline)",
    }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 12 }}>{eyebrow}</div>}
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 44,
          letterSpacing: "-0.02em",
          color: "var(--bone-100)",
          margin: 0,
          lineHeight: 1.05,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            color: "var(--bone-400)",
            fontSize: 14,
            margin: "12px 0 0",
            maxWidth: 560,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

Object.assign(window, {
  Stars, PosterPlaceholder, ScoreBadge, ReasonChip,
  FilmCard, Sidebar, SectionHeader,
});
