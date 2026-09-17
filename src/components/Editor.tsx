"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Undo2,
  Redo2,
  Download,
  Save,
  FolderOpen,
  MousePointer2,
  Hand,
  Minus,
  Plus,
  Maximize,
  Grid2X2,
  ScanLine,
  Magnet,
  Box,
  PenTool,
  Flower2,
  Layers as LayersIcon,
  Printer,
  Image as ImageIcon,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { useEditor, initialize } from "../state/editor";
import { buildGeometry } from "../geometry/envelope";
import { boolean, rect } from "../geometry/polygons";
import { transform } from "../geometry/transforms";
import { preflight } from "../manufacturing/model";
import { Parameters, PrintSettings } from "./Parameters";
import { Library } from "./Library";
import { Layers, Reference } from "./Layers";
import { Properties, type TargetRegion } from "./Properties";
import { Canvas2D } from "./Canvas2D";
import { Preview3D } from "./Preview3D";
import {
  download,
  projectFromJSON,
  svgFile,
  stlFile,
  profileFile,
} from "../export/files";
const tabs = [
  ["library", "Дизайн", Flower2],
  ["shape", "Конверт", PenTool],
  ["layers", "Слои", LayersIcon],
  ["print", "Печать", Printer],
  ["reference", "Референс", ImageIcon],
] as const;
export default function Editor() {
  const s = useEditor(),
    [tab, setTab] = useState<string>("library"),
    [target, setTarget] = useState<TargetRegion>("base"),
    [exportOpen, setExportOpen] = useState(false),
    [side, setSide] = useState<"all" | "bottom" | "top">("all"),
    [toast, setToast] = useState(""),
    [ready, setReady] = useState(false);
  const loadRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    initialize();
    setReady(true);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const fn = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).closest("input,textarea,select")) return;
      const st = useEditor.getState();
      const mod = ev.metaKey || ev.ctrlKey;
      if (mod && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        ev.shiftKey ? st.redo() : st.undo();
      } else if (mod && ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        download(
          "envelope.tulle.json",
          JSON.stringify(st.project, null, 2),
          "application/json",
        );
      } else if (ev.key === "Escape") {
        st.select([]);
        setExportOpen(false);
      } else if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(ev.key)
      ) {
        ev.preventDefault();
        const n = ev.shiftKey ? 10 : 1;
        st.commit((p) => {
          p.ornaments.forEach((o) => {
            if (
              (st.selection.includes(o.id) || p.ornaments.length === 1) &&
              !o.locked &&
              !p.layers.ornaments.locked
            ) {
              o.x +=
                ev.key === "ArrowRight" ? n : ev.key === "ArrowLeft" ? -n : 0;
              o.y += ev.key === "ArrowDown" ? n : ev.key === "ArrowUp" ? -n : 0;
            }
          });
        });
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  const g = useMemo(() => buildGeometry(s.project), [s.project]);
  const warnings = useMemo(() => preflight(s.project, g), [s.project, g]);
  const region = g.base;
  async function openProject(file: File) {
    try {
      if (file.size > 8000000) throw new Error("Проект больше 8 МБ");
      s.replace(projectFromJSON(await file.text()));
      setToast("Редактируемый проект открыт");
    } catch (e) {
      s.set({
        error: e instanceof Error ? e.message : "Не удалось открыть проект",
      });
    }
  }
  async function exportFile(type: "svg" | "stl" | "profile") {
    try {
      if (type === "svg") {
        const svgSide = side === "all" ? "top" : side;
        download(
          `envelope-${svgSide}.svg`,
          await svgFile(s.project, svgSide),
          "image/svg+xml",
        );
      } else if (type === "stl") {
        const stl = await stlFile(s.project, side);
        download(
          `envelope-${side}.stl`,
          stl.buffer as ArrayBuffer,
          "model/stl",
        );
      } else
        download(
          "print-profile.json",
          profileFile(s.project),
          "application/json",
        );
      setToast("Файл подготовлен для скачивания");
    } catch (e) {
      s.set({ error: e instanceof Error ? e.message : "Ошибка экспорта" });
    }
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">t</span>
          <span>
            tulle<span className="brand-studio">studio</span>
          </span>
        </div>
        <div className="project-title">
          <input
            aria-label="Название проекта"
            value={s.project.name}
            onChange={(ev) => {
              if (ev.target.value.trim())
                s.commit((p) => {
                  p.name = ev.target.value;
                });
            }}
          />
          <span>Конверт из пяти частей · v0.2</span>
        </div>
        <div className="history-controls">
          <button
            className="icon-button"
            aria-label="Отменить"
            title="Отменить · ⌘Z"
            disabled={!s.past.length}
            onClick={s.undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Повторить"
            title="Повторить · ⇧⌘Z"
            disabled={!s.future.length}
            onClick={s.redo}
          >
            <Redo2 size={18} />
          </button>
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            title="Открыть JSON проекта"
            aria-label="Открыть проект"
            onClick={() => loadRef.current?.click()}
          >
            <FolderOpen size={18} />
          </button>
          <button
            className="save-button"
            aria-label="Сохранить проект"
            onClick={() => {
              download(
                "envelope.tulle.json",
                JSON.stringify(s.project, null, 2),
                "application/json",
              );
              setToast("Проект сохранён в редактируемом JSON");
            }}
          >
            <Save size={16} />
            <span>Сохранить</span>
          </button>
          <button className="primary" onClick={() => setExportOpen(true)}>
            <Download size={16} />
            Экспорт
            <ChevronDown size={14} />
          </button>
        </div>
        <input
          ref={loadRef}
          hidden
          type="file"
          accept=".json"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (f) void openProject(f);
            ev.target.value = "";
          }}
        />
      </header>
      <div className="workspace">
        <nav className="toolrail" aria-label="Панели редактора">
          {tabs.map(([id, title, Icon]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              title={title}
              aria-label={title}
              onClick={() => setTab(id)}
            >
              <Icon size={21} />
              <span>{title}</span>
            </button>
          ))}
          <div className="rail-bottom">
            PLA
            <br />+<br />
            ткань
          </div>
        </nav>
        <aside className="left-panel">
          {tab === "shape" ? (
            <Parameters />
          ) : tab === "library" ? (
            <Library />
          ) : tab === "layers" ? (
            <Layers />
          ) : tab === "print" ? (
            <PrintSettings />
          ) : (
            <Reference />
          )}
        </aside>
        <main className="workbench">
          <div className="canvas-toolbar">
            <div className="segmented">
              <button
                className={s.mode === "2d" ? "active" : ""}
                onClick={() => s.set({ mode: "2d" })}
              >
                <PenTool size={15} />
                Развёртка
              </button>
              <button
                className={s.mode === "3d" ? "active" : ""}
                onClick={() => s.set({ mode: "3d" })}
              >
                <Box size={15} />
                3D и складывание
              </button>
            </div>
            <span className="millimeter-badge">мм</span>
          </div>
          <div className="canvas-heading">
            <div>
              <span className="eyebrow">ОСНОВАНИЕ И ЧЕТЫРЕ ЛЕПЕСТКА</span>
              <h1>
                Готовое <em>кружевное полотно.</em>
              </h1>
            </div>
            <span className="project-size">
              {s.project.envelope.width} × {s.project.envelope.height}
              <small>закрытый конверт, мм</small>
            </span>
          </div>
          <div className="canvas-stage">
            {ready ? (
              s.mode === "2d" ? (
                <Canvas2D geometry={g} region={region} />
              ) : (
                <Preview3D geometry={g} />
              )
            ) : (
              <div className="loading">Строим геометрию…</div>
            )}
            {s.mode === "2d" && (
              <div className="floating-tools">
                <button
                  aria-label="Выбор"
                  title="Выбор"
                  className={s.tool === "select" ? "active" : ""}
                  onClick={() => s.set({ tool: "select" })}
                >
                  <MousePointer2 size={18} />
                </button>
                <button
                  aria-label="Перемещение холста"
                  title="Перемещение холста"
                  className={s.tool === "pan" ? "active" : ""}
                  onClick={() => s.set({ tool: "pan" })}
                >
                  <Hand size={18} />
                </button>
              </div>
            )}
          </div>
          <div
            className="canvas-controls"
            style={s.mode === "3d" ? { visibility: "hidden" } : undefined}
          >
            <div className="view-controls">
              <button
                aria-label="Сетка"
                title="Сетка"
                className={s.grid ? "active" : ""}
                onClick={() => s.set({ grid: !s.grid })}
              >
                <Grid2X2 size={16} />
              </button>
              <button
                aria-label="Направляющие и зоны"
                title="Направляющие и зоны"
                className={s.guides ? "active" : ""}
                onClick={() => s.set({ guides: !s.guides })}
              >
                <ScanLine size={16} />
              </button>
              <button
                aria-label="Привязка"
                title="Привязка"
                className={s.snap ? "active" : ""}
                onClick={() => s.set({ snap: !s.snap })}
              >
                <Magnet size={16} />
              </button>
              <select
                aria-label="Шаг привязки"
                value={s.gridStep}
                onChange={(ev) => s.set({ gridStep: Number(ev.target.value) })}
              >
                {[0.5, 1, 2, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} мм
                  </option>
                ))}
              </select>
            </div>
            <div className="zoom-controls">
              <button
                aria-label="Уменьшить"
                onClick={() => s.set({ zoom: Math.max(0.4, s.zoom / 1.2) })}
              >
                <Minus size={16} />
              </button>
              <span>{Math.round(s.zoom * 100)}%</span>
              <button
                aria-label="Увеличить"
                onClick={() => s.set({ zoom: Math.min(4, s.zoom * 1.2) })}
              >
                <Plus size={16} />
              </button>
              <button
                aria-label="Вписать в окно"
                title="Вписать в окно"
                onClick={() => s.set({ zoom: 1, pan: { x: 0, y: 0 } })}
              >
                <Maximize size={15} />
              </button>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="legend-pla" />
              PLA
            </span>
            <span>
              <i className="legend-fabric" />
              Ткань
            </span>
            <span>
              <i className="legend-zone" />
              Свободный сгиб
            </span>
            <span className="legend-last">
              На столе {g.width.toFixed(1)} × {g.total.toFixed(1)} мм
            </span>
          </div>
        </main>
        <aside className="right-panel">
          <Properties region={region} target={target} setTarget={setTarget} />
        </aside>
      </div>
      <footer className="statusbar">
        <span>
          <Check size={13} /> 5 частей · 4 защищённых сгиба
        </span>
        <span>{warnings[0] || "Тканевые шарниры свободны от PLA"}</span>
        <span>Локальный проект · JSON</span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {s.error && (
        <div className="error-banner" role="alert">
          <span>
            {s.error.length > 300
              ? "Некорректные параметры проекта. Проверьте допустимые значения."
              : s.error}
          </span>
          <button
            aria-label="Закрыть ошибку"
            onClick={() => s.set({ error: "" })}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {exportOpen && (
        <div className="modal-backdrop" onClick={() => setExportOpen(false)}>
          <section
            className="export-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Экспорт конверта"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="panel-heading">
              <span className="eyebrow">ОТ ДИЗАЙНА К ОБЪЕКТУ</span>
              <button
                className="icon-button"
                aria-label="Закрыть экспорт"
                onClick={() => setExportOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <h2>
              Готово к<br />
              <em>следующему шагу.</em>
            </h2>
            <label className="field">
              <span>Геометрия экспорта</span>
              <select
                value={side}
                onChange={(ev) => setSide(ev.target.value as typeof side)}
              >
                <option value="all">Оба PLA слоя (STL) / верхний (SVG)</option>
                <option value="bottom">Нижний PLA</option>
                <option value="top">Верхний PLA</option>
              </select>
            </label>
            <div className="export-options">
              <button onClick={() => exportFile("svg")}>
                <PenTool size={21} />
                <span>
                  <b>SVG</b>
                  <small>Контуры в мм · без подложки и guides</small>
                </span>
                <Download size={18} />
              </button>
              <button onClick={() => exportFile("stl")}>
                <Box size={21} />
                <span>
                  <b>STL</b>
                  <small>Проверка замкнутости перед экспортом</small>
                </span>
                <Download size={18} />
              </button>
              <button onClick={() => exportFile("profile")}>
                <Printer size={21} />
                <span>
                  <b>Профиль печати</b>
                  <small>Слои, ткань, пауза и расчёт Z · JSON</small>
                </span>
                <Download size={18} />
              </button>
            </div>
            <div className="soft-callout">
              STL не содержит паузу. Сохраните исходную высоту Z при импорте
              слоёв в слайсер. Перед изделием напечатайте пробный купон; способ
              скрепления боковин ещё требует проверки.
            </div>
            {warnings.map((w) => (
              <p className="note" key={w}>
                {w}
              </p>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
