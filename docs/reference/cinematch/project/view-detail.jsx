// Film detail modal — "why recommended" explainer
function DetailView({ film, allRecs, onClose }) {
  if (!film) return null;
  const fullFilm = {
    ...film,
    tagline: film.tagline || "We share the same sky.",
    runtime: film.runtime || 102,
    genres: film.genres || ["Drama"],
    why: film.why || "Slow, observational dramas with father-daughter intimacy — three of your five-star films share this DNA.",
    matches: film.matches || ["Past Lives", "The Souvenir", "Petite Maman"],
    score: film.score ?? 0.94,
  };

  // Use a few related recs as "you might also like"
  const related = (allRecs || []).filter(r => r.id !== film.id).slice(0, 4);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
        padding: "60px 24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(1080px, 100%)",
          background: "var(--ink-850)",
          border: "var(--hairline)",
          borderRadius: "var(--r-3)",
          overflow: "hidden",
        }}
      >
        {/* Top strip: poster + headline */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 48,
          padding: "48px 48px 40px",
          borderBottom: "var(--hairline)",
        }}>
          <div>
            <PosterPlaceholder title={fullFilm.title} year={fullFilm.year} size="lg" />
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={onClose} style={{
              position: "absolute",
              top: -8, right: -8,
              background: "transparent",
              border: "var(--hairline-soft)",
              color: "var(--bone-300)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              width: 36, height: 36,
              borderRadius: "50%",
            }}>✕</button>

            <div className="eyebrow" style={{ color: "var(--amber-400)", marginBottom: 12 }}>
              {Math.round(fullFilm.score * 100)}% Match · in your wheelhouse
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 64,
              letterSpacing: "-0.025em",
              lineHeight: 0.95,
              color: "var(--bone-100)",
              margin: 0,
            }}>
              {fullFilm.title}
            </h1>
            <div style={{
              display: "flex", gap: 16, alignItems: "center",
              marginTop: 12,
              fontFamily: "var(--font-mono)",
              fontSize: 11, color: "var(--bone-400)", letterSpacing: "0.08em",
            }}>
              <span>{fullFilm.year}</span>
              <span style={{ color: "var(--ink-600)" }}>/</span>
              <span>{fullFilm.director}</span>
              <span style={{ color: "var(--ink-600)" }}>/</span>
              <span>{fullFilm.runtime} MIN</span>
              <span style={{ color: "var(--ink-600)" }}>/</span>
              <span>{fullFilm.genres.join(" · ").toUpperCase()}</span>
            </div>

            <p style={{
              fontFamily: "var(--font-display)", fontStyle: "italic",
              fontSize: 22, color: "var(--bone-200)", lineHeight: 1.35,
              marginTop: 24, maxWidth: 540,
            }}>
              “{fullFilm.tagline}”
            </p>

            <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button style={{
                background: "var(--amber-500)",
                color: "var(--ink-900)",
                border: 0,
                padding: "12px 18px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: "var(--r-2)",
                fontWeight: 600,
              }}>
                + Letterboxd watchlist
              </button>
              <button style={{
                background: "transparent",
                color: "var(--bone-200)",
                border: "var(--hairline)",
                padding: "12px 18px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: "var(--r-2)",
              }}>
                Trailer ↗
              </button>
              <button style={{
                background: "transparent",
                color: "var(--bone-400)",
                border: "var(--hairline-soft)",
                padding: "12px 18px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: "var(--r-2)",
              }}>
                Not interested
              </button>
            </div>
          </div>
        </div>

        {/* Why recommended — diagram */}
        <div style={{ padding: "40px 48px", borderBottom: "var(--hairline)" }}>
          <div className="eyebrow" style={{ marginBottom: 24 }}>The connection</div>
          <WhyDiagram film={fullFilm} />
        </div>

        {/* Score breakdown */}
        <div style={{ padding: "40px 48px", borderBottom: "var(--hairline)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Score breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ScoreBar label="Genre overlap" value={0.91} />
              <ScoreBar label="Director affinity" value={0.74} />
              <ScoreBar label="Decade preference" value={0.88} />
              <ScoreBar label="Tonal match" value={0.82} />
              <ScoreBar label="Runtime fit" value={0.95} />
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Plot synopsis</div>
            <p style={{ color: "var(--bone-300)", fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              An eleven-year-old returns to her mother's childhood home after her grandmother's death, where she meets a girl her own age building a treehouse in the woods. A small, time-bent meditation on grief, lineage, and the strange compression of childhood time.
            </p>
            <div style={{ marginTop: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>From your diary</div>
              <p style={{ color: "var(--bone-400)", fontSize: 13, lineHeight: 1.6, margin: 0, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                You haven't logged this film yet.
              </p>
            </div>
          </div>
        </div>

        {/* You might also like */}
        <div style={{ padding: "40px 48px" }}>
          <div className="eyebrow" style={{ marginBottom: 24 }}>If you click with this, also try</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {related.map(r => <FilmCard key={r.id} film={r} onClick={() => {}} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em" }}>
        <span style={{ color: "var(--bone-300)", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: "var(--amber-300)" }}>{Math.round(value * 100)}</span>
      </div>
      <div style={{ height: 4, background: "var(--ink-700)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${value * 100}%`,
          height: "100%",
          background: "var(--amber-500)",
        }} />
      </div>
    </div>
  );
}

function WhyDiagram({ film }) {
  // visual: this film at center, lines out to anchor films + reason badges
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      gap: 32,
      alignItems: "center",
    }}>
      {/* Left: anchor films from history */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="eyebrow" style={{ color: "var(--bone-500)" }}>Your high-rated films</div>
        {film.matches.map((m, i) => (
          <div key={m} style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr auto",
            gap: 12,
            alignItems: "center",
            padding: "10px 14px",
            border: "var(--hairline-soft)",
            borderRadius: "var(--r-2)",
            background: "var(--ink-800)",
          }}>
            <div style={{ width: 36 }}>
              <PosterPlaceholder title={m} size="sm" />
            </div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 16,
              color: "var(--bone-200)",
              lineHeight: 1.1,
            }}>
              {m}
            </div>
            <span className="stars" style={{ fontSize: 11 }}>★★★★★</span>
          </div>
        ))}
      </div>

      {/* Center: connection lines + label */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minWidth: 140 }}>
        <svg width="80" height="120" viewBox="0 0 80 120" style={{ overflow: "visible" }}>
          <line x1="0" y1="20" x2="80" y2="60" stroke="var(--amber-500)" strokeWidth="1" strokeDasharray="2 3" />
          <line x1="0" y1="60" x2="80" y2="60" stroke="var(--amber-500)" strokeWidth="1" strokeDasharray="2 3" />
          <line x1="0" y1="100" x2="80" y2="60" stroke="var(--amber-500)" strokeWidth="1" strokeDasharray="2 3" />
          <circle cx="80" cy="60" r="3" fill="var(--amber-500)" />
        </svg>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "var(--amber-400)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          textAlign: "center",
          padding: "6px 10px",
          border: "1px solid var(--amber-700)",
          borderRadius: "var(--r-pill)",
        }}>
          shared DNA
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--bone-500)", textAlign: "center", lineHeight: 1.5 }}>
          slow cinema<br/>·<br/>quiet drama<br/>·<br/>family<br/>·<br/>2020s
        </div>
      </div>

      {/* Right: this film */}
      <div style={{
        padding: 20,
        border: "1px solid var(--amber-700)",
        background: "rgba(180, 110, 40, 0.04)",
        borderRadius: "var(--r-3)",
      }}>
        <div className="eyebrow" style={{ color: "var(--amber-400)", marginBottom: 12 }}>The recommendation</div>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 16, alignItems: "center" }}>
          <PosterPlaceholder title={film.title} year={film.year} size="sm" />
          <div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 24,
              color: "var(--bone-100)",
              lineHeight: 1.05,
            }}>
              {film.title}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", marginTop: 6, letterSpacing: "0.08em" }}>
              {film.director}, {film.year}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DetailView });
