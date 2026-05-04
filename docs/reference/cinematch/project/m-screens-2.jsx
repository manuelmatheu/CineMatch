// CineMatch mobile screens, set 2: upcoming, taste, diary, setup
const { useState: ms2S } = React;

// ─────────────────────────────────────────────────────────────
// UPCOMING
// ─────────────────────────────────────────────────────────────
function MUpcomingScreen({ data, onTab, onOpenFilm }) {
  return (
    <MobileShell footerActive="upcoming" onTab={onTab}>
      <MHeader
        eyebrow="Filtered to your taste · region AR"
        title="Coming Soon"
      />
      <div style={{ padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {data.upcoming.map(film => {
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
                gridTemplateColumns: "60px 70px 1fr",
                gap: 14, alignItems: "center",
                background: "transparent", border: 0, padding: "12px 0",
                borderBottom: "var(--hairline-soft)",
                textAlign: "left", color: "inherit", cursor: "pointer",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--amber-400)", letterSpacing: "0.18em" }}>{month}</div>
                <div style={{
                  fontFamily: "var(--font-display)", fontStyle: "italic",
                  fontSize: 36, color: "var(--bone-100)", lineHeight: 1, marginTop: 2,
                }}>{day}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--bone-500)", letterSpacing: "0.1em", marginTop: 2 }}>
                  IN {days}D
                </div>
              </div>
              <div><MPoster title={film.title} year={film.year} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontStyle: "italic",
                  fontSize: 19, color: "var(--bone-100)", lineHeight: 1.05,
                }}>{film.title}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-400)", marginTop: 4, letterSpacing: "0.08em" }}>
                  {film.director.toUpperCase()}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 12, color: "var(--bone-300)", marginTop: 6 }}>
                  → {film.reason}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </MobileShell>
  );
}

// ─────────────────────────────────────────────────────────────
// TASTE
// ─────────────────────────────────────────────────────────────
function MTasteScreen({ data, onTab }) {
  const t = data.taste;
  return (
    <MobileShell footerActive="taste" onTab={onTab}>
      <MHeader
        eyebrow="847 films · 2019 → present"
        title="Your taste"
      />
      <div style={{ padding: "0 20px 32px" }}>
        {/* 2x2 stat grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: "var(--hairline)", borderRadius: 4,
          marginTop: 12,
          overflow: "hidden",
        }}>
          {[
            { label: "Films logged", value: "847", sub: "since Apr 2019" },
            { label: "This year", value: "112", sub: "+18% YoY" },
            { label: "Avg rating", value: "3.4", sub: "★★★⯨" },
            { label: "Avg runtime", value: "118", sub: "minutes" },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: "16px 14px",
              borderRight: i % 2 === 0 ? "var(--hairline)" : "none",
              borderBottom: i < 2 ? "var(--hairline)" : "none",
            }}>
              <div className="eyebrow" style={{ marginBottom: 8, fontSize: 9 }}>{s.label}</div>
              <div style={{
                fontFamily: "var(--font-display)", fontStyle: "italic",
                fontSize: 36, color: "var(--bone-100)", lineHeight: 1, letterSpacing: "-0.02em",
              }}>{s.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-500)", marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Genres */}
        <div style={{ marginTop: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Genre affinity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {t.topGenres.slice(0, 6).map((g, i) => (
              <div key={g.name} style={{
                display: "grid", gridTemplateColumns: "16px 90px 1fr 32px",
                gap: 10, alignItems: "center",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-500)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{
                  fontFamily: "var(--font-display)", fontStyle: "italic",
                  fontSize: 16, color: i < 3 ? "var(--bone-100)" : "var(--bone-300)",
                }}>{g.name}</span>
                <div style={{ height: 2, background: "var(--ink-700)" }}>
                  <div style={{
                    width: `${g.weight * 100}%`, height: "100%",
                    background: i < 3 ? "var(--amber-500)" : "var(--ink-500)",
                  }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", textAlign: "right" }}>
                  {g.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top directors */}
        <div style={{ marginTop: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Top directors</div>
          <div>
            {t.topDirectors.slice(0, 5).map((d, i) => (
              <div key={d.name} style={{
                display: "grid", gridTemplateColumns: "1fr auto auto",
                gap: 12, alignItems: "baseline",
                padding: "10px 0",
                borderBottom: i < 4 ? "var(--hairline-soft)" : "none",
              }}>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--bone-100)" }}>
                  {d.name}
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-400)", letterSpacing: "0.08em" }}>
                  {d.count} FILMS
                </span>
                <MStars value={d.avgRating} size={10} />
              </div>
            ))}
          </div>
        </div>

        {/* Decade bar chart */}
        <div style={{ marginTop: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Decades</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${t.decades.length}, 1fr)`,
            alignItems: "end",
            height: 140, paddingBottom: 24,
            borderBottom: "var(--hairline)",
          }}>
            {t.decades.map(d => {
              const max = Math.max(...t.decades.map(x => x.count));
              const h = (d.count / max) * 100;
              return (
                <div key={d.decade} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-300)" }}>{d.count}</span>
                  <div style={{
                    width: "60%", height: `${h}%`,
                    background: d.decade === "2010s" ? "var(--amber-500)" : "var(--ink-600)",
                  }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--bone-500)" }}>
                    {d.decade.replace("s", "")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Languages */}
        <div style={{ marginTop: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Languages</div>
          <div style={{ display: "flex", height: 24, borderRadius: 3, overflow: "hidden", border: "var(--hairline-soft)" }}>
            {t.languages.map((l, i) => (
              <div key={l.name} style={{
                flex: l.pct,
                background: ["var(--amber-500)", "var(--amber-600)", "var(--amber-700)", "var(--ink-600)", "var(--ink-700)", "var(--ink-750)"][i],
              }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
            {t.languages.map((l, i) => (
              <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: 1,
                  background: ["var(--amber-500)", "var(--amber-600)", "var(--amber-700)", "var(--ink-600)", "var(--ink-700)", "var(--ink-750)"][i],
                }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-300)" }}>
                  {l.name} <span style={{ color: "var(--bone-500)" }}>{l.pct}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

// ─────────────────────────────────────────────────────────────
// DIARY
// ─────────────────────────────────────────────────────────────
function MDiaryScreen({ data, onTab }) {
  return (
    <MobileShell footerActive="diary" onTab={onTab}>
      <MHeader
        eyebrow="Live · synced 12m ago"
        title="Recent diary"
        right={<span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--positive)", letterSpacing: "0.1em" }}>● RSS</span>}
      />
      <div style={{ padding: "8px 20px 32px" }}>
        {data.recentDiary.map((entry, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "60px 1fr auto",
            gap: 14, alignItems: "center",
            padding: "14px 0",
            borderBottom: "var(--hairline-soft)",
          }}>
            <div style={{ width: 60 }}>
              <MPoster title={entry.title} year={entry.year} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "var(--font-display)", fontStyle: "italic",
                fontSize: 17, color: "var(--bone-100)", lineHeight: 1.1,
              }}>{entry.title}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-400)", marginTop: 4 }}>
                {entry.year} · {new Date(entry.date).toLocaleDateString("en", { month: "short", day: "numeric" }).toUpperCase()}
              </div>
            </div>
            <MStars value={entry.rating} size={11} />
          </div>
        ))}
      </div>
    </MobileShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SETUP — full-screen mobile onboarding (3 steps)
// ─────────────────────────────────────────────────────────────
function MSetupScreen({ step = 1, onClose }) {
  const steps = [
    { n: "01", label: "Letterboxd" },
    { n: "02", label: "TMDB" },
    { n: "03", label: "History" },
  ];
  return (
    <MobileShell hideFooter>
      <div style={{ padding: "60px 24px 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              flex: 1, height: 2,
              background: i + 1 <= step ? "var(--amber-500)" : "var(--ink-700)",
            }} />
          ))}
        </div>

        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Step {steps[step - 1].n} · {steps[step - 1].label}
        </div>

        {step === 1 && (
          <>
            <h1 style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
              fontSize: 44, lineHeight: 0.95, letterSpacing: "-0.025em",
              color: "var(--bone-100)", margin: 0,
            }}>
              Who are you<br/>on Letterboxd?
            </h1>
            <p style={{ color: "var(--bone-400)", fontSize: 14, lineHeight: 1.5, margin: "16px 0 24px" }}>
              We'll fetch your last ~50 watches from your public RSS feed.
            </p>
            <div style={{
              display: "flex", alignItems: "center",
              border: "var(--hairline)", borderRadius: 6,
              padding: "14px 14px",
              background: "var(--ink-850)",
              gap: 6,
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--bone-500)" }}>
                letterboxd.com/
              </span>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: 14,
                color: "var(--bone-100)",
              }}>manuelmatheu</span>
              <span style={{
                width: 1.5, height: 16, background: "var(--amber-400)",
                marginLeft: 1, animation: "blink 1s infinite",
              }} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
              fontSize: 44, lineHeight: 0.95, letterSpacing: "-0.025em",
              color: "var(--bone-100)", margin: 0,
            }}>Paste your<br/>TMDB token</h1>
            <p style={{ color: "var(--bone-400)", fontSize: 14, lineHeight: 1.5, margin: "16px 0 24px" }}>
              Free + non-commercial. Stored in localStorage only — never on a server.
            </p>
            <div style={{
              border: "var(--hairline)", borderRadius: 6,
              padding: "14px 14px",
              background: "var(--ink-850)",
              fontFamily: "var(--font-mono)", fontSize: 12,
              color: "var(--bone-300)",
              wordBreak: "break-all", lineHeight: 1.5,
            }}>
              eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI…
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
              fontSize: 44, lineHeight: 0.95, letterSpacing: "-0.025em",
              color: "var(--bone-100)", margin: 0,
            }}>Drop your<br/>CSV export</h1>
            <p style={{ color: "var(--bone-400)", fontSize: 14, lineHeight: 1.5, margin: "16px 0 24px" }}>
              Optional but recommended. Gives us your full history, not just the recent 50.
            </p>
            <div style={{
              border: "1px dashed var(--ink-500)",
              borderRadius: 6,
              padding: "32px 16px",
              textAlign: "center",
              background: "rgba(255,255,255,0.01)",
            }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-300)",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
              }}>Tap to choose CSV</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-500)" }}>
                stays on your device
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onClose} style={{
            background: "var(--bone-100)", color: "var(--ink-900)",
            border: 0, padding: "16px",
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.12em", textTransform: "uppercase",
            borderRadius: 6, fontWeight: 600,
          }}>Continue →</button>
          {step === 3 && (
            <button style={{
              background: "transparent", color: "var(--bone-400)",
              border: 0, padding: "12px",
              fontFamily: "var(--font-mono)", fontSize: 11,
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>Skip for now</button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

Object.assign(window, { MUpcomingScreen, MTasteScreen, MDiaryScreen, MSetupScreen });
