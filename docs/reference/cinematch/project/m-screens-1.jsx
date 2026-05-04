// CineMatch mobile screens — feed, detail, upcoming, taste, diary, setup
const { useState: msS } = React;

// ─────────────────────────────────────────────────────────────
// FEED — hero "Tonight's pick" + horizontal rails + grid
// ─────────────────────────────────────────────────────────────
function MFeedScreen({ data, onOpenFilm }) {
  const [tab, setTab] = msS("feed");
  return (
    <MobileShell footerActive={tab} onTab={setTab}>
      <MHeader
        eyebrow="04 May · 12 new picks"
        title="CineMatch"
        right={
          <button style={{
            width: 36, height: 36, borderRadius: 18,
            border: "var(--hairline)", background: "transparent",
            color: "var(--bone-200)", fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}>↻</button>
        }
      />

      {/* Tonight's pick — full-bleed hero */}
      <section style={{ padding: "0 20px", marginTop: 4, marginBottom: 32 }}>
        <div className="eyebrow" style={{ color: "var(--amber-400)", marginBottom: 10 }}>
          ▸ Tonight's pick
        </div>
        <button onClick={() => onOpenFilm(data.hero)} style={{
          background: "transparent", border: 0, padding: 0, width: "100%", textAlign: "left", color: "inherit",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <MPoster title={data.hero.title} year={data.hero.year} ratio="3 / 4" big />
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
              fontSize: 38, lineHeight: 0.95, letterSpacing: "-0.02em",
              color: "var(--bone-100)", margin: 0,
            }}>{data.hero.title}</h2>
            <div style={{
              display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
              marginTop: 8,
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--bone-400)", letterSpacing: "0.08em",
            }}>
              <span>{data.hero.year}</span>
              <span style={{ color: "var(--ink-600)" }}>/</span>
              <span>{data.hero.director.toUpperCase()}</span>
              <span style={{ color: "var(--ink-600)" }}>/</span>
              <span>{data.hero.runtime} MIN</span>
            </div>
          </div>
          <div style={{
            padding: "14px 14px 14px 16px",
            border: "var(--hairline)",
            borderLeft: "2px solid var(--amber-500)",
            background: "rgba(255,255,255,0.015)",
            borderRadius: 4,
          }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Why you'll love it</div>
            <p style={{ margin: 0, color: "var(--bone-200)", fontSize: 13, lineHeight: 1.5 }}>
              {data.hero.why}
            </p>
          </div>
        </button>
      </section>

      {/* Section title */}
      <section style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          paddingBottom: 12, borderBottom: "var(--hairline)",
        }}>
          <h2 style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
            fontSize: 24, color: "var(--bone-100)", margin: 0, letterSpacing: "-0.01em",
          }}>More for you</h2>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-500)", letterSpacing: "0.1em" }}>
            12 FILMS
          </span>
        </div>
      </section>

      {/* Horizontal rail — by director */}
      <Rail title="Because of Céline Sciamma" films={data.recommendations.slice(0, 4)} onOpenFilm={onOpenFilm} />

      {/* Horizontal rail — by tonal match */}
      <Rail title="Slow-cinema kick" films={data.recommendations.slice(3, 8)} onOpenFilm={onOpenFilm} />

      {/* 2-col grid */}
      <section style={{ padding: "8px 20px 24px" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>The full list</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          rowGap: 24,
        }}>
          {data.recommendations.map(film => (
            <MGridCard key={film.id} film={film} onClick={() => onOpenFilm(film)} />
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

function Rail({ title, films, onOpenFilm }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 20px", marginBottom: 12 }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
          fontSize: 18, color: "var(--bone-100)", margin: 0,
        }}>{title}</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-500)" }}>→</span>
      </div>
      <div style={{
        display: "flex", gap: 12,
        overflowX: "auto", overflowY: "hidden",
        padding: "0 20px 4px",
        scrollbarWidth: "none",
      }}>
        {films.map(film => (
          <button
            key={film.id}
            onClick={() => onOpenFilm(film)}
            style={{
              flex: "0 0 120px",
              background: "transparent", border: 0, padding: 0, color: "inherit", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 8, cursor: "pointer",
            }}
          >
            <div style={{ position: "relative" }}>
              <MPoster title={film.title} year={film.year} />
              <div style={{ position: "absolute", bottom: 4, left: 4 }}>
                <MMatch score={film.score} />
              </div>
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontStyle: "italic",
              fontSize: 13, lineHeight: 1.1, color: "var(--bone-100)",
            }}>{film.title}</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-500)",
              letterSpacing: "0.05em",
            }}>{film.director}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MGridCard({ film, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: 0, padding: 0, color: "inherit", textAlign: "left",
      display: "flex", flexDirection: "column", gap: 8, cursor: "pointer",
    }}>
      <div style={{ position: "relative" }}>
        <MPoster title={film.title} year={film.year} />
        <div style={{ position: "absolute", bottom: 6, left: 6 }}>
          <MMatch score={film.score} />
        </div>
      </div>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic",
        fontSize: 15, lineHeight: 1.1, color: "var(--bone-100)",
      }}>{film.title}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-400)", letterSpacing: "0.05em" }}>
        {film.director} · {film.year}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL — full screen with poster hero + why diagram
// ─────────────────────────────────────────────────────────────
function MDetailScreen({ film, onClose }) {
  if (!film) return null;
  const f = {
    ...film,
    tagline: film.tagline || "We share the same sky.",
    runtime: film.runtime || 102,
    genres: film.genres || ["Drama"],
    why: film.why || "Slow, observational dramas with father-daughter intimacy — three of your five-star films share this DNA.",
    matches: film.matches || ["Past Lives", "The Souvenir", "Petite Maman"],
    score: film.score ?? 0.94,
  };
  return (
    <MobileShell hideFooter>
      {/* Full-bleed poster hero */}
      <div style={{ position: "relative" }}>
        <div style={{
          width: "100%", aspectRatio: "3 / 4",
          backgroundImage: "repeating-linear-gradient(45deg, var(--ink-700) 0, var(--ink-700) 12px, var(--ink-750) 12px, var(--ink-750) 24px)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 50%, var(--ink-900) 100%)",
          }} />
          <button onClick={onClose} style={{
            position: "absolute", top: 56, left: 16,
            width: 36, height: 36, borderRadius: 18,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "var(--bone-100)", fontFamily: "var(--font-mono)", fontSize: 14,
          }}>←</button>
          <div style={{
            position: "absolute", top: 56, right: 16,
            display: "flex", gap: 8,
          }}>
            <button style={{
              width: 36, height: 36, borderRadius: 18,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "var(--bone-100)", fontFamily: "var(--font-mono)", fontSize: 14,
            }}>♡</button>
            <button style={{
              width: 36, height: 36, borderRadius: 18,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "var(--bone-100)", fontFamily: "var(--font-mono)", fontSize: 14,
            }}>↗</button>
          </div>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "0 20px 20px",
          }}>
            <div className="eyebrow" style={{ color: "var(--amber-400)", marginBottom: 8 }}>
              {Math.round(f.score * 100)}% Match · in your wheelhouse
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
              fontSize: 48, lineHeight: 0.92, letterSpacing: "-0.025em",
              color: "var(--bone-100)", margin: 0,
            }}>{f.title}</h1>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 32px" }}>
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          marginTop: 12,
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--bone-400)", letterSpacing: "0.08em",
        }}>
          <span>{f.year}</span>
          <span style={{ color: "var(--ink-600)" }}>/</span>
          <span>{f.director.toUpperCase()}</span>
          <span style={{ color: "var(--ink-600)" }}>/</span>
          <span>{f.runtime} MIN</span>
          <span style={{ color: "var(--ink-600)" }}>/</span>
          <span>{f.genres.join(" · ").toUpperCase()}</span>
        </div>

        <p style={{
          fontFamily: "var(--font-display)", fontStyle: "italic",
          fontSize: 18, color: "var(--bone-200)", lineHeight: 1.35,
          marginTop: 16,
        }}>“{f.tagline}”</p>

        {/* Primary action */}
        <button style={{
          width: "100%",
          background: "var(--amber-500)",
          color: "var(--ink-900)",
          border: 0, padding: "16px",
          fontFamily: "var(--font-mono)", fontSize: 12,
          letterSpacing: "0.12em", textTransform: "uppercase",
          borderRadius: 6, fontWeight: 600,
          marginTop: 20,
        }}>
          + Add to Letterboxd watchlist
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <button style={{
            background: "transparent", color: "var(--bone-200)",
            border: "var(--hairline)", padding: "12px",
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.1em", textTransform: "uppercase",
            borderRadius: 6,
          }}>Trailer ↗</button>
          <button style={{
            background: "transparent", color: "var(--bone-400)",
            border: "var(--hairline-soft)", padding: "12px",
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.1em", textTransform: "uppercase",
            borderRadius: 6,
          }}>Not for me</button>
        </div>

        {/* Why recommended — vertical mobile diagram */}
        <div style={{ marginTop: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>The connection</div>
          <p style={{ color: "var(--bone-300)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
            {f.why}
          </p>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {f.matches.map(m => (
              <div key={m} style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                gap: 12, alignItems: "center",
                padding: "10px 12px",
                border: "var(--hairline-soft)",
                borderRadius: 4,
                background: "var(--ink-800)",
              }}>
                <div style={{ width: 40 }}>
                  <MPoster title={m} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: "var(--bone-100)", lineHeight: 1.1 }}>{m}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-500)", letterSpacing: "0.05em", marginTop: 2 }}>From your diary</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--amber-400)" }}>★★★★★</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{ marginTop: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Score breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MScoreBar label="Genre overlap" value={0.91} />
            <MScoreBar label="Director affinity" value={0.74} />
            <MScoreBar label="Decade preference" value={0.88} />
            <MScoreBar label="Tonal match" value={0.82} />
            <MScoreBar label="Runtime fit" value={0.95} />
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

function MScoreBar({ label, value }) {
  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", marginBottom: 4,
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.05em",
      }}>
        <span style={{ color: "var(--bone-300)", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: "var(--amber-300)" }}>{Math.round(value * 100)}</span>
      </div>
      <div style={{ height: 3, background: "var(--ink-700)", borderRadius: 2 }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: "var(--amber-500)" }} />
      </div>
    </div>
  );
}

Object.assign(window, { MFeedScreen, MDetailScreen, Rail, MGridCard, MScoreBar });
