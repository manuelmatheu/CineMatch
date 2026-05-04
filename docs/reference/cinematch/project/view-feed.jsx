// Recommendations feed view: hero "tonight's pick" + dense grid below
const { useState: useStateFeed } = React;

function HeroPick({ film, onOpen }) {
  return (
    <section className="hero-pick" style={{
      display: "grid",
      gap: 48,
      alignItems: "center",
      padding: "8px 0 56px",
      borderBottom: "var(--hairline)",
      marginBottom: 56,
    }}>
      <div>
        <PosterPlaceholder title={film.title} year={film.year} size="lg" />
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 16, color: "var(--amber-400)" }}>
          ▸ Tonight's pick · 04 May 2026
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(56px, 6vw, 88px)",
          letterSpacing: "-0.025em",
          lineHeight: 0.95,
          color: "var(--bone-100)",
          margin: 0,
        }}>
          {film.title}
        </h1>
        <div style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: 16,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--bone-400)",
          letterSpacing: "0.08em",
        }}>
          <span>{film.year}</span>
          <span style={{ color: "var(--ink-600)" }}>/</span>
          <span>{film.director}</span>
          <span style={{ color: "var(--ink-600)" }}>/</span>
          <span>{film.runtime} MIN</span>
          <span style={{ color: "var(--ink-600)" }}>/</span>
          <span>{film.genres.join(" · ").toUpperCase()}</span>
        </div>
        <p style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 22,
          lineHeight: 1.3,
          color: "var(--bone-200)",
          marginTop: 28,
          maxWidth: 580,
        }}>
          “{film.tagline}”
        </p>
        <div style={{
          marginTop: 28,
          padding: "20px 24px",
          border: "var(--hairline)",
          borderLeft: "2px solid var(--amber-500)",
          background: "rgba(255,255,255,0.015)",
          maxWidth: 620,
        }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Why we think you'll love it
          </div>
          <p style={{ margin: 0, color: "var(--bone-200)", fontSize: 15, lineHeight: 1.55 }}>
            {film.why}
          </p>
          <div style={{
            marginTop: 14,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-500)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Anchored on
            </span>
            {film.matches.map(m => (
              <span key={m} style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 14,
                color: "var(--bone-300)",
                borderBottom: "1px dotted var(--ink-500)",
                paddingBottom: 1,
              }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
          <button onClick={onOpen} style={{
            background: "var(--bone-100)",
            color: "var(--ink-900)",
            border: 0,
            padding: "14px 22px",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderRadius: "var(--r-2)",
            fontWeight: 600,
          }}>
            See details →
          </button>
          <button style={{
            background: "transparent",
            color: "var(--bone-200)",
            border: "var(--hairline)",
            padding: "14px 22px",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderRadius: "var(--r-2)",
          }}>
            + Letterboxd watchlist
          </button>
          <button title="Not interested" style={{
            background: "transparent",
            color: "var(--bone-400)",
            border: "var(--hairline-soft)",
            padding: "14px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            borderRadius: "var(--r-2)",
          }}>
            ✕
          </button>
        </div>
      </div>
    </section>
  );
}

function FilterBar({ filter, setFilter }) {
  const filters = ["all", "director", "genre", "similar"];
  const labels = { all: "All reasons", director: "By director", genre: "By genre", similar: "Similar films" };
  return (
    <div style={{
      display: "flex",
      gap: 4,
      marginBottom: 24,
      padding: 4,
      border: "var(--hairline-soft)",
      borderRadius: "var(--r-2)",
      width: "fit-content",
    }}>
      {filters.map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          style={{
            padding: "8px 14px",
            background: filter === f ? "var(--ink-700)" : "transparent",
            color: filter === f ? "var(--bone-100)" : "var(--bone-400)",
            border: 0,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderRadius: "var(--r-1)",
            transition: "all var(--dur)",
          }}
        >
          {labels[f]}
        </button>
      ))}
    </div>
  );
}

function FeedView({ data, density, onOpenFilm }) {
  const [filter, setFilter] = useStateFeed("all");
  const filtered = filter === "all"
    ? data.recommendations
    : data.recommendations.filter(r => r.reason === filter);

  const cols = density === "sparse" ? 3 : density === "list" ? 1 : 4;
  const isList = density === "list";

  return (
    <div>
      <HeroPick film={data.hero} onOpen={() => onOpenFilm(data.hero)} />

      <SectionHeader
        eyebrow="More for you · refreshed daily"
        title="Drawn from your last 30 watches"
        subtitle="Each film is scored against the directors, genres, and tonal patterns we see in your diary. Refine the list with the filter."
        action={
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-500)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {filtered.length} films
          </div>
        }
      />

      <FilterBar filter={filter} setFilter={setFilter} />

      {isList ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((film, i) => (
            <FilmListRow key={film.id} film={film} index={i + 1} onClick={() => onOpenFilm(film)} />
          ))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: density === "sparse" ? 40 : 28,
          rowGap: density === "sparse" ? 56 : 40,
        }}>
          {filtered.map(film => (
            <FilmCard key={film.id} film={film} onClick={() => onOpenFilm(film)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilmListRow({ film, index, onClick }) {
  const [hover, setHover] = useStateFeed(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "32px 60px 1fr auto auto auto",
        gap: 24,
        alignItems: "center",
        padding: "16px 8px",
        background: hover ? "var(--ink-800)" : "transparent",
        border: 0,
        borderBottom: "var(--hairline-soft)",
        color: "inherit",
        textAlign: "left",
        transition: "background var(--dur)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-500)" }}>
        {String(index).padStart(2, "0")}
      </span>
      <div style={{ width: 60 }}>
        <PosterPlaceholder title={film.title} year={film.year} size="sm" />
      </div>
      <div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 22,
          color: "var(--bone-100)",
          lineHeight: 1.1,
        }}>
          {film.title}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", marginTop: 4, letterSpacing: "0.08em" }}>
          {film.director} · {film.year} · {film.runtime} MIN
        </div>
      </div>
      <div style={{ minWidth: 200 }}>
        <ReasonChip reason={film.reason} basis={film.basis} />
      </div>
      <ScoreBadge score={film.score} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: hover ? "var(--bone-200)" : "var(--bone-500)" }}>
        →
      </span>
    </button>
  );
}

Object.assign(window, { FeedView, HeroPick });
