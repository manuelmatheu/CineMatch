// Fixture data for CineMatch prototype.
// Posters are striped placeholders with monospace labels — no fake imagery.

window.CINEMATCH_DATA = {
  user: {
    username: "manuelmatheu",
    joined: "2019-04-12",
    totalWatched: 847,
    thisYear: 112,
    avgRating: 3.4,
  },

  // The single "tonight's pick" — top recommendation
  hero: {
    id: 1,
    title: "Aftersun",
    year: 2022,
    director: "Charlotte Wells",
    runtime: 102,
    genres: ["Drama"],
    score: 0.94,
    why: "Slow, observational dramas with father-daughter intimacy — three of your five-star films share this DNA.",
    matches: ["Past Lives", "The Souvenir", "Petite Maman"],
    tagline: "We share the same sky.",
  },

  recommendations: [
    { id: 2, title: "Petite Maman", year: 2021, director: "Céline Sciamma", runtime: 72, genres: ["Drama","Fantasy"], score: 0.92, reason: "director", basis: "Portrait of a Lady on Fire" },
    { id: 3, title: "The Souvenir", year: 2019, director: "Joanna Hogg", runtime: 119, genres: ["Drama","Romance"], score: 0.89, reason: "genre", basis: "slow-cinema affinity" },
    { id: 4, title: "Drive My Car", year: 2021, director: "Ryusuke Hamaguchi", runtime: 179, genres: ["Drama"], score: 0.88, reason: "similar", basis: "Burning" },
    { id: 5, title: "Decision to Leave", year: 2022, director: "Park Chan-wook", runtime: 138, genres: ["Mystery","Romance"], score: 0.86, reason: "director", basis: "The Handmaiden" },
    { id: 6, title: "Showing Up", year: 2022, director: "Kelly Reichardt", runtime: 108, genres: ["Comedy","Drama"], score: 0.85, reason: "director", basis: "First Cow" },
    { id: 7, title: "Memoria", year: 2021, director: "Apichatpong Weerasethakul", runtime: 136, genres: ["Drama","Mystery"], score: 0.83, reason: "genre", basis: "slow-cinema affinity" },
    { id: 8, title: "EO", year: 2022, director: "Jerzy Skolimowski", runtime: 88, genres: ["Drama"], score: 0.82, reason: "similar", basis: "Cow" },
    { id: 9, title: "All of Us Strangers", year: 2023, director: "Andrew Haigh", runtime: 105, genres: ["Drama","Romance","Fantasy"], score: 0.81, reason: "genre", basis: "queer drama" },
    { id: 10, title: "Past Lives", year: 2023, director: "Celine Song", runtime: 105, genres: ["Drama","Romance"], score: 0.80, reason: "similar", basis: "Aftersun" },
    { id: 11, title: "Pacifiction", year: 2022, director: "Albert Serra", runtime: 165, genres: ["Drama"], score: 0.78, reason: "genre", basis: "slow-cinema affinity" },
    { id: 12, title: "Saint Omer", year: 2022, director: "Alice Diop", runtime: 122, genres: ["Drama"], score: 0.77, reason: "genre", basis: "court drama" },
    { id: 13, title: "Return to Seoul", year: 2022, director: "Davy Chou", runtime: 119, genres: ["Drama"], score: 0.76, reason: "similar", basis: "Past Lives" },
  ],

  upcoming: [
    { id: 101, title: "The Brutalist", year: 2025, director: "Brady Corbet", releaseDate: "2026-05-22", genres: ["Drama","History"], reason: "Drama is your top genre" },
    { id: 102, title: "Bugonia", year: 2026, director: "Yorgos Lanthimos", releaseDate: "2026-06-14", genres: ["Comedy","Sci-Fi"], reason: "You've watched 4 Lanthimos films" },
    { id: 103, title: "After the Hunt", year: 2026, director: "Luca Guadagnino", releaseDate: "2026-07-08", genres: ["Drama","Thriller"], reason: "You've watched 6 Guadagnino films" },
    { id: 104, title: "Marty Supreme", year: 2026, director: "Josh Safdie", releaseDate: "2026-09-03", genres: ["Drama","Sport"], reason: "Safdies are in your top directors" },
    { id: 105, title: "Father Mother Sister Brother", year: 2026, director: "Jim Jarmusch", releaseDate: "2026-10-17", genres: ["Drama","Comedy"], reason: "Drama is your top genre" },
    { id: 106, title: "Eddington", year: 2026, director: "Ari Aster", releaseDate: "2026-08-22", genres: ["Western","Drama"], reason: "You've watched 3 Aster films" },
  ],

  recentDiary: [
    { title: "The Zone of Interest", year: 2023, rating: 4.5, date: "2026-04-29" },
    { title: "Inland Empire", year: 2006, rating: 5.0, date: "2026-04-26" },
    { title: "Anatomy of a Fall", year: 2023, rating: 4.0, date: "2026-04-24" },
    { title: "The Holdovers", year: 2023, rating: 3.5, date: "2026-04-21" },
    { title: "Killers of the Flower Moon", year: 2023, rating: 4.0, date: "2026-04-19" },
    { title: "Poor Things", year: 2023, rating: 4.5, date: "2026-04-15" },
    { title: "Perfect Days", year: 2023, rating: 5.0, date: "2026-04-12" },
  ],

  taste: {
    topGenres: [
      { name: "Drama", count: 312, weight: 0.92 },
      { name: "Romance", count: 89, weight: 0.71 },
      { name: "Mystery", count: 76, weight: 0.65 },
      { name: "Comedy", count: 102, weight: 0.58 },
      { name: "Thriller", count: 84, weight: 0.54 },
      { name: "Sci-Fi", count: 56, weight: 0.48 },
      { name: "Horror", count: 41, weight: 0.32 },
      { name: "Animation", count: 38, weight: 0.44 },
    ],
    topDirectors: [
      { name: "Hirokazu Kore-eda", count: 8, avgRating: 4.4 },
      { name: "Paul Thomas Anderson", count: 7, avgRating: 4.6 },
      { name: "Lynne Ramsay", count: 5, avgRating: 4.5 },
      { name: "Hong Sang-soo", count: 11, avgRating: 4.0 },
      { name: "Claire Denis", count: 6, avgRating: 4.2 },
      { name: "Wim Wenders", count: 6, avgRating: 4.3 },
      { name: "Lucrecia Martel", count: 4, avgRating: 4.7 },
    ],
    decades: [
      { decade: "1960s", count: 24 },
      { decade: "1970s", count: 58 },
      { decade: "1980s", count: 71 },
      { decade: "1990s", count: 96 },
      { decade: "2000s", count: 142 },
      { decade: "2010s", count: 248 },
      { decade: "2020s", count: 208 },
    ],
    runtime: { avg: 118, longest: 236, shortest: 72 },
    languages: [
      { name: "English", pct: 54 },
      { name: "Japanese", pct: 11 },
      { name: "French", pct: 9 },
      { name: "Korean", pct: 7 },
      { name: "Spanish", pct: 6 },
      { name: "Other", pct: 13 },
    ],
  },
};
