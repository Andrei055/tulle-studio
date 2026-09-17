import type { Envelope, Project } from "../domain/project";
import {
  boolean,
  offset,
  union,
  rect,
  positive,
  area,
  type Point,
  type Paths,
} from "./polygons";
import { transform } from "./transforms";
export function contour(e: Envelope): Paths {
  const W = e.width,
    F = e.flapHeight,
    T = F + e.height + e.pocketHeight;
  let base: Point[];
  if (e.flapShape === "triangle")
    base = [
      { X: 0, Y: F },
      { X: W / 2, Y: 0 },
      { X: W, Y: F },
      { X: W, Y: T },
      { X: 0, Y: T },
    ];
  else if (e.flapShape === "round") {
    base = Array.from({ length: 49 }, (_, i) => {
      const a = Math.PI + (i * Math.PI) / 48;
      return { X: W / 2 + (W / 2) * Math.cos(a), Y: F + F * Math.sin(a) };
    });
    base.push({ X: W, Y: T }, { X: 0, Y: T });
  } else base = rect(0, 0, W, T)[0];
  if (e.contour === "straight" || e.amplitude === 0) return [positive(base)];
  // Inward wave, anchored at polygon vertices; bounds remain nominal.
  const pts: Point[] = [];
  let firstEdge = 0;
  if (e.flapShape === "round") {
    // Sample the entire arc as one curve: wave count must not depend on
    // how many straight segments happened to approximate the ellipse.
    const halfPerimeter = Math.PI * Math.sqrt(((W / 2) ** 2 + F ** 2) / 2);
    const cycles = Math.max(2, Math.round((halfPerimeter / W) * e.waves));
    const samples = Math.ceil((cycles * e.density) / 2) * 2;
    for (let j = 0; j < samples; j++) {
      const t = j / samples,
        a = Math.PI + t * Math.PI;
      const nx = Math.cos(a) / (W / 2),
        ny = Math.sin(a) / F;
      const length = Math.hypot(nx, ny);
      // Anchor endpoints and apex to preserve exact manufacturing bounds.
      const fade = Math.min(1, t * 8, (1 - t) * 8, Math.abs(t - 0.5) * 8);
      const wave =
        ((e.amplitude *
          (1 -
            Math.cos(2 * Math.PI * cycles * t + (e.phase * Math.PI) / 180))) /
          2) *
        fade;
      pts.push({
        X: W / 2 + (W / 2) * Math.cos(a) - (nx / length) * wave,
        Y: F + F * Math.sin(a) - (ny / length) * wave,
      });
    }
    firstEdge = 48;
  }
  for (let i = firstEdge; i < base.length; i++) {
    const p = base[i],
      q = base[(i + 1) % base.length],
      dx = q.X - p.X,
      dy = q.Y - p.Y,
      len = Math.hypot(dx, dy);
    const cycles = Math.max(1, Math.round((len / W) * e.waves)),
      n = Math.max(2, cycles * e.density);
    const amplitude = Math.min(e.amplitude, len / 8);
    for (let j = 0; j < n; j++) {
      const t = j / n,
        fade = Math.min(1, t * 8, (1 - t) * 8);
      const wave =
        ((amplitude *
          (1 -
            Math.cos(2 * Math.PI * cycles * t + (e.phase * Math.PI) / 180))) /
          2) *
        fade;
      pts.push({
        X: p.X + dx * t - (dy / len) * wave,
        Y: p.Y + dy * t + (dx / len) * wave,
      });
    }
  }
  return [positive(pts)];
}
export function envelopeGeometry(e: Envelope) {
  const outer = contour(e),
    total = e.flapHeight + e.height + e.pocketHeight;
  const keepOut = union(
    rect(-10, e.flapHeight - e.foldWidth / 2, e.width + 20, e.foldWidth),
    rect(
      -10,
      e.flapHeight + e.height - e.foldWidth / 2,
      e.width + 20,
      e.foldWidth,
    ),
    rect(
      -10,
      total - e.closingWidth - e.borderWidth,
      e.width + 20,
      e.closingWidth,
    ),
  );
  const border = boolean(
    boolean(outer, offset(outer, -e.borderWidth), "difference"),
    keepOut,
    "difference",
  );
  const allowed = boolean(
    offset(outer, -e.borderWidth - e.edgeClearance),
    keepOut,
    "difference",
  );
  return { outer, border, allowed, keepOut, total };
}
export function buildGeometry(p: Project) {
  const g = envelopeGeometry(p.envelope);
  const items = p.ornaments.map((o) => ({
    id: o.id,
    raw: transform(o),
    paths: boolean(transform(o), g.allowed, "intersection"),
  }));
  const visible = items.filter(
    (i) => p.ornaments.find((o) => o.id === i.id)?.visible,
  );
  const border = p.layers.border.visible ? g.border : [];
  const make = (side: "bottom" | "top") =>
    boolean(
      union(
        border,
        ...(p.layers.ornaments.visible
          ? visible
              .filter((i) => p.ornaments.find((o) => o.id === i.id)?.[side])
              .map((i) => i.paths)
          : []),
      ),
      g.keepOut,
      "difference",
    );
  const bottom = make("bottom"),
    top = make("top");
  const warnings: string[] = [];
  if (
    items.some(
      (i) => area(boolean(i.raw, i.raw, "union")) - area(i.paths) > 0.05,
    )
  )
    warnings.push("Части орнаментов обрезаны по допустимой области.");
  if (!bottom.length && !top.length)
    warnings.push("Нет геометрии PLA для экспорта.");
  return { ...g, items, bottom, top, warnings };
}
export type Geometry = ReturnType<typeof buildGeometry>;
