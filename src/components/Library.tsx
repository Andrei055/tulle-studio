"use client";
import { useState, useEffect } from "react";
import { Search, Star, Plus } from "lucide-react";
import { assets } from "../library";
import { pathData } from "../geometry/polygons";
import { centered, instance } from "../geometry/transforms";
import { envelopeGeometry } from "../geometry/envelope";
import { useEditor } from "../state/editor";
export function Library() {
  const s = useEditor(),
    [query, setQuery] = useState(""),
    [cat, setCat] = useState("Все"),
    [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem("tulle-favorites") || "[]"));
    } catch {}
  }, []);
  const filtered = assets.filter(
    (a) =>
      (cat === "Все" ||
        (cat === "Избранное" && favorites.includes(a.id)) ||
        a.category === cat) &&
      [a.name, ...a.tags].join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <p className="eyebrow">ВЕКТОРНАЯ БИБЛИОТЕКА</p>
      <h2>
        Маленькие
        <br />
        <em>детали.</em>
      </h2>
      <div className="search">
        <Search size={16} />
        <input
          aria-label="Поиск орнаментов"
          placeholder="Цветок, лист, рамка…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="chips">
        {["Все", "Цветы", "Ботаника", "Геометрия", "Бордюры", "Избранное"].map(
          (c) => (
            <button
              className={cat === c ? "active" : ""}
              key={c}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ),
        )}
      </div>
      <div className="asset-grid">
        {filtered.map((a) => (
          <div key={a.id} className="asset-card">
            <button
              className="favorite icon-button"
              aria-label={`В избранное: ${a.name}`}
              aria-pressed={favorites.includes(a.id)}
              onClick={() => {
                const f = favorites.includes(a.id)
                  ? favorites.filter((x) => x !== a.id)
                  : [...favorites, a.id];
                setFavorites(f);
                try {
                  localStorage.setItem("tulle-favorites", JSON.stringify(f));
                } catch {}
              }}
            >
              <Star
                size={13}
                fill={favorites.includes(a.id) ? "currentColor" : "none"}
              />
            </button>
            <button
              className="asset-insert"
              aria-label={`Добавить: ${a.name}`}
              disabled={s.project.layers.ornaments.locked}
              onClick={() => {
                const o = centered(
                  instance(a.id),
                  envelopeGeometry(s.project.envelope).allowed,
                  "both",
                );
                s.commit((p) => {
                  p.ornaments.push(o);
                });
                s.select([o.id]);
              }}
            >
              <svg
                viewBox={`${a.viewBox[0] - 4} ${a.viewBox[1] - 4} ${a.viewBox[2] + 8} ${a.viewBox[3] + 8}`}
              >
                <path d={pathData(a.paths)} fill="currentColor" />
              </svg>
              <span>
                {a.name}
                <Plus size={13} />
              </span>
            </button>
          </div>
        ))}
      </div>
      {!filtered.length && (
        <p className="muted">Орнаментов по этому запросу нет.</p>
      )}
      <p className="note">
        6 тестовых орнаментов · собственная векторная геометрия. Каждый
        экземпляр редактируется независимо.
      </p>
    </>
  );
}
