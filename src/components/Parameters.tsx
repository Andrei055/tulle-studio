"use client";
import { useEditor } from "../state/editor";
import { NumberField, Toggle } from "./Fields";
import type { Envelope, PrintProfile } from "../domain/project";
import { heights } from "../manufacturing/model";
import { preset } from "../geometry/presets";
export function Parameters() {
  const s = useEditor(),
    e = s.project.envelope;
  const set = <K extends keyof Envelope>(k: K, v: Envelope[K]) =>
    s.commit((p) => {
      p.envelope[k] = v;
      if (k === "height")
        p.envelope.pocketHeight = Math.min(
          p.envelope.pocketHeight,
          p.envelope.height,
        );
    });
  return (
    <>
      <p className="eyebrow">ОСНОВА ДИЗАЙНА</p>
      <h2>
        Форма вашего
        <br />
        <em>письма.</em>
      </h2>
      <label className="field">
        <span>Размер конверта</span>
        <select
          aria-label="Размер конверта"
          value="custom"
          onChange={(ev) => {
            const [w, h] = ev.target.value.split("x").map(Number);
            if (w)
              s.commit((p) => {
                p.envelope.width = w;
                p.envelope.height = h;
                p.envelope.pocketHeight = Math.min(p.envelope.pocketHeight, h);
              });
          }}
        >
          <option value="custom">
            Свой размер · {e.width} × {e.height}
          </option>
          <option value="180x85">Классический · 180 × 85</option>
          <option value="165x80">Компактный · 165 × 80</option>
          <option value="200x100">Большой · 200 × 100</option>
        </select>
      </label>
      <div className="field-grid">
        <NumberField
          label="Ширина"
          value={e.width}
          min={80}
          max={300}
          onChange={(v) => set("width", v)}
        />
        <NumberField
          label="Высота спинки"
          value={e.height}
          min={50}
          max={150}
          onChange={(v) => set("height", v)}
        />
        <NumberField
          label="Карман"
          value={e.pocketHeight}
          min={25}
          max={e.height}
          onChange={(v) => set("pocketHeight", v)}
        />
        <NumberField
          label="Клапан"
          value={e.flapHeight}
          min={20}
          max={100}
          onChange={(v) => set("flapHeight", v)}
        />
      </div>
      <label className="field">
        <span>Форма клапана</span>
        <select
          value={e.flapShape}
          onChange={(ev) =>
            set("flapShape", ev.target.value as Envelope["flapShape"])
          }
        >
          <option value="straight">Прямой</option>
          <option value="round">Округлый</option>
          <option value="triangle">Треугольный</option>
        </select>
      </label>
      <div className="section-label">Наружный контур</div>
      <div className="shape-options">
        <button
          className={e.contour === "straight" ? "active" : ""}
          onClick={() => set("contour", "straight")}
        >
          <svg viewBox="0 0 70 25">
            <path d="M5 20V5H65V20" />
          </svg>
          Прямой
        </button>
        <button
          className={e.contour === "wave" ? "active" : ""}
          onClick={() => set("contour", "wave")}
        >
          <svg viewBox="0 0 70 25">
            <path d="M5 20Q0 12 5 5Q10 0 15 5T25 5T35 5T45 5T55 5T65 5Q70 12 65 20" />
          </svg>
          Волна
        </button>
      </div>
      {e.contour === "wave" && (
        <div className="field-grid">
          <NumberField
            label="Амплитуда"
            value={e.amplitude}
            min={0}
            max={6}
            onChange={(v) => set("amplitude", v)}
          />
          <NumberField
            label="Число волн"
            value={e.waves}
            min={2}
            max={30}
            step={1}
            unit=""
            onChange={(v) => set("waves", Math.round(v))}
          />
          <NumberField
            label="Фаза"
            value={e.phase}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={(v) => set("phase", v)}
          />
          <NumberField
            label="Точек на волну"
            value={e.density}
            min={8}
            max={48}
            step={1}
            unit=""
            onChange={(v) => set("density", Math.round(v))}
          />
        </div>
      )}
      <div className="section-label">Рамка и гибкость</div>
      <div className="field-grid">
        <NumberField
          label="Ширина рамки"
          value={e.borderWidth}
          min={0.8}
          max={8}
          onChange={(v) => set("borderWidth", v)}
        />
        <NumberField
          label="Отступ декора"
          value={e.edgeClearance}
          min={0}
          max={10}
          onChange={(v) => set("edgeClearance", v)}
        />
        <NumberField
          label="Зона сгиба"
          value={e.foldWidth}
          min={1}
          max={12}
          onChange={(v) => set("foldWidth", v)}
        />
        <NumberField
          label="Закрывание"
          value={e.closingWidth}
          min={0}
          max={12}
          onChange={(v) => set("closingWidth", v)}
        />
      </div>
      <div className="soft-callout">
        Пластик автоматически исключается из зон сгиба. Здесь остаётся только
        ткань.
      </div>
      <div className="section-label">Начать с композиции</div>
      <div className="preset-list">
        {(
          [
            ["floral", "Цветочное письмо"],
            ["branches", "Ботанический этюд"],
            ["minimal", "Тихая геометрия"],
          ] as const
        ).map(([id, name]) => (
          <button
            key={id}
            onClick={() => {
              s.replace(preset(id, s.project));
            }}
          >
            {name}
            <span>↗</span>
          </button>
        ))}
      </div>
      <p className="note">
        Композиция заменяет текущие орнаменты. Изменение можно отменить.
      </p>
    </>
  );
}
export function PrintSettings() {
  const s = useEditor(),
    p = s.project.print,
    h = heights(p);
  const set = <K extends keyof PrintProfile>(k: K, v: PrintProfile[K]) =>
    s.commit((x) => {
      x.print[k] = v;
      if (k === "bottomLayerCount") x.print.pauseAfterLayer = Number(v);
    });
  return (
    <>
      <p className="eyebrow">ПРОИЗВОДСТВО</p>
      <h2>
        Слой за
        <br />
        <em>слоем.</em>
      </h2>
      <label className="field">
        <span>Принтер</span>
        <input
          value={p.printer}
          onChange={(ev) => set("printer", ev.target.value)}
        />
      </label>
      <div className="field-grid">
        <NumberField
          label="Сопло"
          value={p.nozzleDiameter}
          min={0.1}
          max={1.2}
          onChange={(v) => set("nozzleDiameter", v)}
        />
        <NumberField
          label="Первый слой"
          value={p.firstLayerHeight}
          min={0.05}
          max={0.6}
          onChange={(v) => set("firstLayerHeight", v)}
        />
        <NumberField
          label="Обычный слой"
          value={p.normalLayerHeight}
          min={0.05}
          max={0.6}
          onChange={(v) => set("normalLayerHeight", v)}
        />
        <NumberField
          label="Слоёв снизу"
          value={p.bottomLayerCount}
          min={1}
          max={20}
          step={1}
          unit=""
          onChange={(v) => set("bottomLayerCount", Math.round(v))}
        />
        <NumberField
          label="Слоёв сверху"
          value={p.topLayerCount}
          min={1}
          max={20}
          step={1}
          unit=""
          onChange={(v) => set("topLayerCount", Math.round(v))}
        />
        <NumberField
          label="Толщина ткани"
          value={p.fabricThickness}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("fabricThickness", v)}
        />
        <NumberField
          label="Зазор ткани"
          value={p.fabricClearance}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("fabricClearance", v)}
        />
      </div>
      <div className="print-stack">
        <div>
          <b>01</b>
          <span>
            Нижний PLA
            <small>
              {h.bottom.toFixed(2)} мм · {p.bottomLayerCount} слоя
            </small>
          </span>
        </div>
        <div>
          <b>02</b>
          <span>
            Пауза → ткань<small>После слоя {p.pauseAfterLayer}</small>
          </span>
        </div>
        <div>
          <b>03</b>
          <span>
            Верхний PLA
            <small>
              {h.top.toFixed(2)} мм · {p.topLayerCount} слоя
            </small>
          </span>
        </div>
      </div>
      <Toggle
        label="Рассчитывать Z продолжения"
        checked={p.resumeAuto}
        onChange={() => set("resumeAuto", !p.resumeAuto)}
      />
      <NumberField
        label="Z сопла при продолжении"
        value={p.recommendedResumeZ}
        min={0.05}
        max={20}
        step={0.01}
        disabled={p.resumeAuto}
        onChange={(v) => set("recommendedResumeZ", v)}
      />
      <p className="note">
        Расчёт: {h.bottom.toFixed(2)} + {p.fabricThickness} +{" "}
        {p.fabricClearance} + {p.normalLayerHeight} = {h.resume.toFixed(2)} мм.
        <br />
        Основание верхней геометрии: {h.topStart.toFixed(2)} мм.
      </p>
      <div className="soft-callout">
        Начальные значения требуют пробной печати. Пауза настраивается в
        слайсере; STL её не содержит.
      </div>
    </>
  );
}
