// Coming Soon, Recent Diary, Settings/Setup views

function UpcomingView({ data, onOpenFilm }) {
  return (
    <div>
      <SectionHeader
        eyebrow="Filtered to your top genres + tracked directors"
        title="Coming Soon"
        subtitle="Upcoming theatrical releases worth keeping on your radar — only films that overlap with your top 5 genres or your tracked directors are shown."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {data.upcoming.map((film, i) => {
          const date = new Date(film.releaseDate);
          const month = date.toLocaleString("en", { month: "short" }).toUpperCase();
          const day = date.getDate();
          const days = Math.round((date - new Date("2026-05-04")) / (1000 * 60 * 60 * 24));
          return (
            <button
              key={film.id}
              onClick={() => onOpenFilm(film)}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 100px 1fr auto auto",
                gap: 32,
                alignItems: "center",
                padding: "24px 8px",
                background: "transparent",
                border: 0,
                borderBottom: "var(--hairline)",
                textAlign: "left",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--amber-400)", letterSpacing: "0.18em" }}>
                  {month}
                </div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 48,
                  color: "var(--bone-100)",
                  lineHeight: 1,
                  marginTop: 4,
                }}>
                  {day}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-500)", letterSpacing: "0.1em", marginTop: 4 }}>
                  IN {days}D
                </div>
              </div>

              <div style={{ width: 80 }}>
                <PosterPlaceholder title={film.title} year={film.year} size="sm" />
              </div>

              <div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 28,
                  color: "var(--bone-100)",
                  lineHeight: 1.05,
                }}>
                  {film.title}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", marginTop: 8, letterSpacing: "0.08em" }}>
                  {film.director} · {film.genres.join(" · ").toUpperCase()}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: "var(--bone-300)", marginTop: 10 }}>
                  → {film.reason}
                </div>
              </div>

              <button style={{
                background: "transparent",
                color: "var(--bone-300)",
                border: "var(--hairline)",
                padding: "8px 14px",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: "var(--r-2)",
              }}>
                Remind me
              </button>

              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--bone-500)" }}>
                ↗
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DiaryView({ data }) {
  return (
    <div>
      <SectionHeader
        eyebrow="Live from your Letterboxd RSS · synced 12m ago"
        title="Recent diary"
        subtitle="Your latest entries. We pull these every six hours from RSS and merge them with your CSV history."
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        {data.recentDiary.map((entry, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "120px 60px 1fr auto auto",
            gap: 24,
            alignItems: "center",
            padding: "20px 8px",
            borderBottom: "var(--hairline-soft)",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-400)", letterSpacing: "0.05em" }}>
              {new Date(entry.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
            </span>
            <div style={{ width: 60 }}>
              <PosterPlaceholder title={entry.title} year={entry.year} size="sm" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: "var(--bone-100)", lineHeight: 1.1 }}>
                {entry.title}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", marginTop: 4 }}>
                {entry.year}
              </div>
            </div>
            <Stars value={entry.rating} size={14} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-500)", letterSpacing: "0.1em" }}>
              RSS
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ data }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <SectionHeader
        eyebrow="Connections + data"
        title="Settings"
        subtitle="Everything is stored in your browser's localStorage. Nothing leaves your machine except calls to TMDB and the Letterboxd RSS proxy."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <SettingsRow
          label="Letterboxd username"
          value="@manuelmatheu"
          status="ok"
          statusText="Live · 50 entries cached"
          action="Change"
        />
        <SettingsRow
          label="TMDB read token"
          value="•••••••••••••••••••••••••••••••••••••••••••••• Mxng"
          status="ok"
          statusText="Validated · 38/40 req remaining"
          action="Replace"
        />
        <SettingsRow
          label="CSV history"
          value="letterboxd-export-2026-04-30.csv"
          status="ok"
          statusText="847 films · 4 days old"
          action="Re-upload"
        />
        <SettingsRow
          label="Region for upcoming"
          value="Argentina (AR)"
          status="ok"
          statusText="Used to filter theatrical releases"
          action="Change"
        />
        <SettingsRow
          label="TMDB cache"
          value="412 films cached"
          status="info"
          statusText="Auto-expires after 24h"
          action="Clear"
        />
        <SettingsRow
          label="Taste profile"
          value="Last computed 12 minutes ago"
          status="ok"
          statusText="Regenerates when history updates"
          action="Recompute"
        />
      </div>

      <div style={{
        marginTop: 56,
        padding: 24,
        border: "var(--hairline)",
        borderRadius: "var(--r-2)",
        background: "rgba(180, 60, 40, 0.04)",
        borderColor: "rgba(180, 60, 40, 0.3)",
      }}>
        <div className="eyebrow" style={{ color: "var(--danger)", marginBottom: 8 }}>Danger zone</div>
        <p style={{ color: "var(--bone-300)", fontSize: 13, margin: "0 0 16px" }}>
          Wipe everything from this browser. You'll need to re-enter your token and re-upload your CSV.
        </p>
        <button style={{
          background: "transparent",
          color: "var(--danger)",
          border: "1px solid var(--danger)",
          padding: "10px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          borderRadius: "var(--r-2)",
        }}>
          Clear all local data
        </button>
      </div>
    </div>
  );
}

function SettingsRow({ label, value, status, statusText, action }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: 24,
      alignItems: "center",
      padding: "20px 0",
      borderBottom: "var(--hairline-soft)",
    }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, color: "var(--bone-100)", lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: status === "ok" ? "var(--positive)" : "var(--bone-400)",
          }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", letterSpacing: "0.05em" }}>
            {statusText}
          </span>
        </div>
      </div>
      <button style={{
        background: "transparent",
        color: "var(--bone-200)",
        border: "var(--hairline)",
        padding: "8px 14px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        borderRadius: "var(--r-2)",
      }}>
        {action}
      </button>
    </div>
  );
}

// === First-time setup overlay ===
function SetupModal({ onClose }) {
  const [step, setStep] = React.useState(1);
  const steps = [
    { n: "01", label: "Letterboxd" },
    { n: "02", label: "TMDB" },
    { n: "03", label: "History" },
    { n: "04", label: "Ready" },
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(10px)",
      zIndex: 200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(720px, 100%)",
        background: "var(--ink-850)",
        border: "var(--hairline)",
        borderRadius: "var(--r-3)",
        overflow: "hidden",
      }}>
        {/* Stepper */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
          borderBottom: "var(--hairline)",
        }}>
          {steps.map((s, i) => (
            <button
              key={s.n}
              onClick={() => setStep(i + 1)}
              style={{
                padding: "16px 20px",
                background: "transparent",
                border: 0,
                borderRight: i < steps.length - 1 ? "var(--hairline-soft)" : "none",
                borderBottom: step === i + 1 ? "2px solid var(--amber-500)" : "2px solid transparent",
                color: step === i + 1 ? "var(--bone-100)" : "var(--bone-500)",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em" }}>{s.n}</span>
              <span style={{ fontSize: 13 }}>{s.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "40px 40px 24px" }}>
          {step === 1 && (
            <>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Step 01 · Letterboxd</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 40, color: "var(--bone-100)", margin: "0 0 12px", lineHeight: 1 }}>
                Who are you on Letterboxd?
              </h2>
              <p style={{ color: "var(--bone-400)", fontSize: 14, margin: "0 0 24px", maxWidth: 480 }}>
                We'll fetch your last ~50 watches from your public RSS feed. Your username is the slug from your profile URL.
              </p>
              <SetupInput prefix="letterboxd.com/" placeholder="manuelmatheu" />
            </>
          )}
          {step === 2 && (
            <>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Step 02 · TMDB</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 40, color: "var(--bone-100)", margin: "0 0 12px", lineHeight: 1 }}>
                Paste your TMDB read token
              </h2>
              <p style={{ color: "var(--bone-400)", fontSize: 14, margin: "0 0 24px", maxWidth: 480 }}>
                Free, non-commercial. Generated at <span className="mono" style={{ color: "var(--bone-200)" }}>themoviedb.org → Settings → API</span>. Stored in localStorage only.
              </p>
              <SetupInput placeholder="eyJhbGciOiJIUzI1NiJ9..." mono />
            </>
          )}
          {step === 3 && (
            <>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Step 03 · History (optional)</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 40, color: "var(--bone-100)", margin: "0 0 12px", lineHeight: 1 }}>
                Drop your CSV export
              </h2>
              <p style={{ color: "var(--bone-400)", fontSize: 14, margin: "0 0 24px", maxWidth: 480 }}>
                Optional but recommended. RSS only sees the last 50 entries — your CSV gives us the full picture. Export from <span className="mono" style={{ color: "var(--bone-200)" }}>letterboxd.com/settings/data</span>.
              </p>
              <div style={{
                border: "1px dashed var(--ink-500)",
                borderRadius: "var(--r-2)",
                padding: "32px",
                textAlign: "center",
                background: "rgba(255,255,255,0.01)",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-300)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Drop diary.csv here
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-500)" }}>
                  or click to browse — never uploaded anywhere
                </div>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div className="eyebrow" style={{ color: "var(--amber-400)", marginBottom: 12 }}>Step 04 · Ready</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 40, color: "var(--bone-100)", margin: "0 0 12px", lineHeight: 1 }}>
                You're set. Resolving your history…
              </h2>
              <p style={{ color: "var(--bone-400)", fontSize: 14, margin: "0 0 24px", maxWidth: 480 }}>
                We're cross-referencing 847 films against TMDB. This takes about 90 seconds the first time, and never again.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <ProgressLine label="Reading CSV" pct={100} done />
                <ProgressLine label="Fetching RSS" pct={100} done />
                <ProgressLine label="Resolving TMDB IDs" pct={64} />
                <ProgressLine label="Computing taste profile" pct={0} />
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: 24, borderTop: "var(--hairline)" }}>
          <button onClick={() => setStep(Math.max(1, step - 1))} style={{
            background: "transparent",
            color: "var(--bone-400)",
            border: 0,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "10px 0",
          }}>
            ← Back
          </button>
          <button
            onClick={() => step < 4 ? setStep(step + 1) : onClose()}
            style={{
              background: "var(--bone-100)",
              color: "var(--ink-900)",
              border: 0,
              padding: "12px 22px",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderRadius: "var(--r-2)",
              fontWeight: 600,
            }}>
            {step === 4 ? "Enter app" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupInput({ prefix, placeholder, mono }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      border: "var(--hairline)",
      borderRadius: "var(--r-2)",
      padding: "14px 16px",
      background: "var(--ink-900)",
      gap: 8,
    }}>
      {prefix && <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--bone-500)" }}>{prefix}</span>}
      <input
        placeholder={placeholder}
        style={{
          flex: 1,
          background: "transparent",
          border: 0,
          outline: 0,
          color: "var(--bone-100)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
          fontSize: 14,
        }}
      />
    </div>
  );
}

function ProgressLine({ label, pct, done }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 40px", gap: 16, alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: done ? "var(--bone-400)" : "var(--bone-200)", letterSpacing: "0.05em" }}>
        {done ? "✓" : "·"} {label}
      </span>
      <div style={{ height: 2, background: "var(--ink-700)" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: done ? "var(--positive)" : "var(--amber-500)", transition: "width 600ms var(--ease-out)" }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

Object.assign(window, { UpcomingView, DiaryView, SettingsView, SetupModal });
