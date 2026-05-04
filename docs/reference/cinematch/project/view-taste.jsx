// Taste profile dashboard — editorial + custom diagrams
function TasteView({ data }) {
  const t = data.taste;
  return (
    <div>
      <SectionHeader
        eyebrow="Your taste · 847 films · 2019 → present"
        title={<>What you've been <em style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>looking at</em></>}
        subtitle="Aggregated from your Letterboxd diary, weighted by your ratings. We use this to score every recommendation."
        action={
          <button style={{
            background: "transparent",
            color: "var(--bone-300)",
            border: "var(--hairline)",
            padding: "10px 14px",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            borderRadius: "var(--r-2)",
          }}>
            Recompute ↻
          </button>
        }
      />

      {/* Top-line stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 0,
        marginBottom: 56,
        border: "var(--hairline)",
        borderRadius: "var(--r-2)",
        overflow: "hidden",
      }}>
        {[
          { label: "Films logged", value: "847", sub: "since Apr 2019" },
          { label: "This year", value: "112", sub: "+18% YoY" },
          { label: "Avg rating", value: "3.4", sub: "★★★⯨" },
          { label: "Avg runtime", value: "118", sub: "minutes" },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: "24px 28px",
            borderRight: i < 3 ? "var(--hairline)" : "none",
          }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{s.label}</div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 56,
              color: "var(--bone-100)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}>
              {s.value}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-500)", marginTop: 8, letterSpacing: "0.05em" }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Genres + Directors side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, marginBottom: 56 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Genre affinity · weighted by rating</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {t.topGenres.map((g, i) => (
              <div key={g.name} style={{
                display: "grid",
                gridTemplateColumns: "20px 130px 1fr 50px",
                gap: 16,
                alignItems: "center",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-500)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 20,
                  color: i < 5 ? "var(--bone-100)" : "var(--bone-300)",
                }}>
                  {g.name}
                </span>
                <div style={{ height: 2, background: "var(--ink-700)", position: "relative" }}>
                  <div style={{
                    width: `${g.weight * 100}%`,
                    height: "100%",
                    background: i < 5 ? "var(--amber-500)" : "var(--ink-500)",
                  }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-400)", textAlign: "right" }}>
                  {g.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Top directors · count × avg rating</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {t.topDirectors.map((d, i) => (
              <div key={d.name} style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 16,
                alignItems: "baseline",
                padding: "12px 0",
                borderBottom: i < t.topDirectors.length - 1 ? "var(--hairline-soft)" : "none",
              }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "var(--bone-100)" }}>
                    {d.name}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-400)", letterSpacing: "0.08em" }}>
                  {d.count} FILMS
                </div>
                <Stars value={d.avgRating} size={11} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decade distribution */}
      <div style={{ marginBottom: 56 }}>
        <div className="eyebrow" style={{ marginBottom: 24 }}>Decades you live in</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${t.decades.length}, 1fr)`,
          gap: 0,
          alignItems: "end",
          height: 200,
          paddingBottom: 32,
          borderBottom: "var(--hairline)",
        }}>
          {t.decades.map(d => {
            const max = Math.max(...t.decades.map(x => x.count));
            const h = (d.count / max) * 100;
            return (
              <div key={d.decade} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-300)" }}>{d.count}</span>
                <div style={{
                  width: "70%",
                  height: `${h}%`,
                  background: d.decade === "2010s" ? "var(--amber-500)" : "var(--ink-600)",
                  transition: "background var(--dur)",
                }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-500)", letterSpacing: "0.08em" }}>
                  {d.decade}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Languages */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Languages</div>
        <div style={{ display: "flex", height: 32, borderRadius: "var(--r-2)", overflow: "hidden", border: "var(--hairline-soft)" }}>
          {t.languages.map((l, i) => (
            <div key={l.name} title={`${l.name} · ${l.pct}%`} style={{
              flex: l.pct,
              background: ["var(--amber-500)", "var(--amber-600)", "var(--amber-700)", "var(--ink-600)", "var(--ink-700)", "var(--ink-750)"][i],
              borderRight: i < t.languages.length - 1 ? "1px solid var(--ink-900)" : "none",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 16 }}>
          {t.languages.map((l, i) => (
            <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2,
                background: ["var(--amber-500)", "var(--amber-600)", "var(--amber-700)", "var(--ink-600)", "var(--ink-700)", "var(--ink-750)"][i],
              }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--bone-300)", letterSpacing: "0.05em" }}>
                {l.name} <span style={{ color: "var(--bone-500)" }}>{l.pct}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TasteView });
