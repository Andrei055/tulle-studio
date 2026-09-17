"use client";
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEditor } from "../state/editor";
import { type Geometry } from "../geometry/envelope";
import { pathData, bounds, centroid, type Paths } from "../geometry/polygons";
import { transform, snapPoint } from "../geometry/transforms";
import type { Instance } from "../domain/project";
type Drag = {
  kind: "move" | "pan" | "scale" | "rotate";
  x: number;
  y: number;
  items: Instance[];
  pan: { x: number; y: number };
};
export function Canvas2D({
  geometry: g,
  region,
}: {
  geometry: Geometry;
  region: Paths;
}) {
  const s = useEditor(),
    e = s.project.envelope,
    svg = useRef<SVGSVGElement>(null),
    drag = useRef<Drag | null>(null);
  const [smart, setSmart] = useState<{ gx?: number; gy?: number }>({});
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const W = e.width + 42,
    H = g.total + 38,
    viewW = W / s.zoom,
    viewH = H / s.zoom,
    vx = -21 + (W - viewW) / 2 + s.pan.x,
    vy = -19 + (H - viewH) / 2 + s.pan.y;
  function point(ev: ReactPointerEvent<SVGElement>) {
    const el = svg.current!,
      p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(
        el.getScreenCTM()!.inverse(),
      );
    return { x: p.x, y: p.y };
  }
  function start(
    ev: ReactPointerEvent<SVGElement>,
    id?: string,
    kind: Drag["kind"] = "move",
  ) {
    if (ev.button !== 0 && ev.button !== 1) return;
    const p = point(ev);
    const pan = s.tool === "pan" || ev.button === 1;
    if (pan) {
      drag.current = { kind: "pan", ...p, items: [], pan: s.pan };
      svg.current?.setPointerCapture(ev.pointerId);
      return;
    }
    if (!id) {
      s.select([]);
      return;
    }
    ev.stopPropagation();
    const item = s.project.ornaments.find((o) => o.id === id)!;
    if (item.locked || s.project.layers.ornaments.locked) return;
    const ids = ev.shiftKey
      ? s.selection.includes(id)
        ? s.selection.filter((x) => x !== id)
        : [...s.selection, id]
      : s.selection.includes(id)
        ? s.selection
        : [id];
    s.select(ids);
    s.begin();
    drag.current = {
      kind,
      ...p,
      items: s.project.ornaments.filter((o) => ids.includes(o.id) && !o.locked),
      pan: s.pan,
    };
    svg.current?.setPointerCapture(ev.pointerId);
  }
  function move(ev: ReactPointerEvent<SVGSVGElement>) {
    const p = point(ev);
    setCoords(p);
    const d = drag.current;
    if (!d) return;
    if (d.kind === "pan") {
      s.set({ pan: { x: s.pan.x + d.x - p.x, y: s.pan.y + d.y - p.y } });
      return;
    }
    if (!d.items.length) return;
    const main = d.items[0],
      dx = p.x - d.x,
      dy = p.y - d.y;
    if (d.kind === "move") {
      let x = main.x + dx,
        y = main.y + dy;
      if (s.snap) {
        const targets = [
          centroid(region),
          ...s.project.ornaments
            .filter((o) => !d.items.some((a) => a.id === o.id) && o.visible)
            .map((o) => ({ x: o.x, y: o.y })),
        ];
        const sp = snapPoint(x, y, s.gridStep, targets, 1.8 / s.zoom);
        x = sp.x;
        y = sp.y;
        setSmart(sp);
      }
      s.live((project) => {
        for (const old of d.items) {
          const o = project.ornaments.find((a) => a.id === old.id)!;
          o.x = old.x + x - main.x;
          o.y = old.y + y - main.y;
        }
      });
    } else if (d.kind === "scale") {
      const oldDist = Math.hypot(d.x - main.x, d.y - main.y),
        ratio = Math.hypot(p.x - main.x, p.y - main.y) / Math.max(oldDist, 0.1);
      s.live((project) => {
        const o = project.ornaments.find((a) => a.id === main.id)!;
        o.scaleX = Math.max(0.1, Math.min(8, main.scaleX * ratio));
        o.scaleY = Math.max(0.1, Math.min(8, main.scaleY * ratio));
      });
    } else {
      const angle =
        ((Math.atan2(p.y - main.y, p.x - main.x) -
          Math.atan2(d.y - main.y, d.x - main.x)) *
          180) /
        Math.PI;
      s.live((project) => {
        project.ornaments.find((a) => a.id === main.id)!.rotation =
          ((main.rotation + angle + 540) % 360) - 180;
      });
    }
  }
  function end() {
    if (drag.current && drag.current.kind !== "pan") s.end();
    drag.current = null;
    setSmart({});
  }
  const c = centroid(region),
    ref = s.project.reference;
  return (
    <div className="canvas-wrap">
      <svg
        ref={svg}
        aria-label="2D редактор конверта"
        className={"editor-svg " + (s.tool === "pan" ? "panning" : "")}
        viewBox={`${vx} ${vy} ${viewW} ${viewH}`}
        onPointerDown={(ev) => start(ev)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onWheel={(ev) => {
          s.set({
            zoom: Math.max(
              0.4,
              Math.min(4, s.zoom * Math.exp(-ev.deltaY * 0.001)),
            ),
          });
        }}
      >
        <defs>
          <pattern id="grid" width={5} height={5} patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r=".14" fill="#aca7a0" />
          </pattern>
          <pattern
            id="fabric"
            width="1"
            height="1"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 0H1M0 0V1"
              fill="none"
              stroke="#7b8474"
              strokeWidth=".07"
              opacity=".55"
            />
          </pattern>
          <pattern
            id="keepout"
            width="3"
            height="3"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <path d="M0 0V3" stroke="#be7966" strokeWidth=".45" />
          </pattern>
        </defs>
        {s.grid && (
          <rect
            x={vx - 1000}
            y={vy - 1000}
            width={3000}
            height={3000}
            fill="url(#grid)"
            pointerEvents="none"
          />
        )}
        {ref && (
          <image
            href={ref.dataUrl}
            x={ref.x}
            y={ref.y}
            width={ref.width}
            opacity={ref.opacity}
            transform={`rotate(${ref.rotation} ${ref.x + ref.width / 2} ${ref.y})`}
            pointerEvents="none"
          />
        )}
        {s.project.layers.fabric.visible && (
          <g pointerEvents="none">
            <path d={pathData(g.outer)} fill="#dce1d3" fillOpacity=".62" />
            <path d={pathData(g.outer)} fill="url(#fabric)" />
          </g>
        )}
        {s.project.layers.border.visible && (
          <path
            d={pathData(g.border)}
            fill="#f9f6f0"
            stroke="#8f7d70"
            strokeWidth=".16"
            fillRule="nonzero"
            pointerEvents="none"
          />
        )}
        {s.guides && (
          <g pointerEvents="none">
            <path
              d={pathData(g.allowed)}
              fill="#a6b494"
              fillOpacity=".12"
              stroke="#899a74"
              strokeWidth=".25"
              strokeDasharray="1 1"
            />
            <path d={pathData(g.keepOut)} fill="url(#keepout)" opacity=".4" />
            <path
              d={`M0 ${e.flapHeight}H${e.width}M0 ${e.flapHeight + e.height}H${e.width}`}
              stroke="#b6806a"
              strokeWidth=".3"
              strokeDasharray="2 1.5"
            />
            <path
              d={`M${c.x} -5V${g.total + 5}M-5 ${c.y}H${e.width + 5}`}
              stroke="#866a95"
              strokeWidth=".25"
              strokeDasharray="2 1.5"
            />
            <text x={e.width + 3} y={e.flapHeight - 2} className="canvas-label">
              сгиб
            </text>
            <text
              x={e.width + 3}
              y={e.flapHeight + e.height - 2}
              className="canvas-label"
            >
              сгиб
            </text>
          </g>
        )}
        {s.project.layers.ornaments.visible &&
          g.items.map((i) => {
            const o = s.project.ornaments.find((o) => o.id === i.id)!;
            if (!o.visible) return null;
            return (
              <g
                key={i.id}
                onPointerDown={(ev) => start(ev, i.id)}
                style={{ cursor: o.locked ? "not-allowed" : "move" }}
              >
                <path
                  d={pathData(i.paths)}
                  fill={s.selection.includes(i.id) ? "#9b526e" : "#fcfaf6"}
                  stroke={s.selection.includes(i.id) ? "#84435c" : "#857b6a"}
                  strokeWidth=".15"
                  fillRule="nonzero"
                />
                <path
                  d={pathData(i.raw)}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        {s.selection.map((id) => {
          const o = s.project.ornaments.find((x) => x.id === id);
          if (!o || !o.visible || !s.project.layers.ornaments.visible)
            return null;
          const b = bounds(transform(o));
          return (
            <g key={id}>
              <rect
                x={b.x - 1}
                y={b.y - 1}
                width={b.width + 2}
                height={b.height + 2}
                fill="none"
                stroke="#9b526e"
                strokeWidth=".35"
                strokeDasharray="1 .7"
                pointerEvents="none"
              />
              {!o.locked && (
                <>
                  <rect
                    aria-label="Масштабировать орнамент"
                    x={b.x + b.width - 1}
                    y={b.y + b.height - 1}
                    width="3"
                    height="3"
                    fill="#9b526e"
                    style={{ cursor: "nwse-resize" }}
                    onPointerDown={(ev) => start(ev, id, "scale")}
                  />
                  <path
                    d={`M${b.cx} ${b.y - 1}V${b.y - 5}`}
                    stroke="#9b526e"
                    strokeWidth=".3"
                  />
                  <circle
                    aria-label="Повернуть орнамент"
                    cx={b.cx}
                    cy={b.y - 6}
                    r="1.5"
                    fill="#fff"
                    stroke="#9b526e"
                    strokeWidth=".4"
                    style={{ cursor: "grab" }}
                    onPointerDown={(ev) => start(ev, id, "rotate")}
                  />
                </>
              )}
            </g>
          );
        })}
        {s.guides && (
          <g pointerEvents="none" className="dimensions">
            <path
              d={`M0 -8H${e.width}M0 -10V-6M${e.width} -10V-6M-9 0V${g.total}M-11 0H-7M-11 ${g.total}H-7`}
              stroke="#8e827e"
              strokeWidth=".2"
            />
            <text x={e.width / 2} y={-10} textAnchor="middle">
              {e.width} мм
            </text>
            <text
              x={-12}
              y={g.total / 2}
              textAnchor="middle"
              transform={`rotate(-90 -12 ${g.total / 2})`}
            >
              {g.total} мм · развёртка
            </text>
            {Array.from({ length: Math.floor(e.width / 20) + 1 }, (_, i) => (
              <text
                key={i}
                x={i * 20}
                y={g.total + 9}
                textAnchor="middle"
                className="ruler-text"
              >
                {i * 20}
              </text>
            ))}
          </g>
        )}
        {smart.gx !== undefined && (
          <path
            d={`M${smart.gx} -10V${g.total + 10}`}
            stroke="#dd7595"
            strokeWidth=".45"
            pointerEvents="none"
          />
        )}
        {smart.gy !== undefined && (
          <path
            d={`M-10 ${smart.gy}H${e.width + 10}`}
            stroke="#dd7595"
            strokeWidth=".45"
            pointerEvents="none"
          />
        )}
      </svg>
      <div className="canvas-bottom">
        <span>
          X {coords.x.toFixed(1)} · Y {coords.y.toFixed(1)} мм
        </span>
        <span>Shift + клик: несколько объектов</span>
      </div>
    </div>
  );
}
