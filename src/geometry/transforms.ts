import type { Instance } from "../domain/project";
import { assetById } from "../library";
import { bounds, centroid, type Paths } from "./polygons";
export function transform(o: Instance): Paths {
  const a = assetById(o.assetId),
    b = bounds(a.paths),
    r = (o.rotation * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  return a.paths
    .map((p) =>
      p.map((v) => {
        const x = (v.X - b.cx) * o.scaleX * (o.flipX ? -1 : 1),
          y = (v.Y - b.cy) * o.scaleY * (o.flipY ? -1 : 1);
        return { X: o.x + x * c - y * s, Y: o.y + x * s + y * c };
      }),
    )
    .map((p) => (o.flipX !== o.flipY ? [...p].reverse() : p));
}
export function centered(
  o: Instance,
  region: Paths,
  axis: "x" | "y" | "both",
): Instance {
  const c = centroid(region),
    b = bounds(transform(o));
  return {
    ...o,
    x: axis === "y" ? o.x : o.x + c.x - b.cx,
    y: axis === "x" ? o.y : o.y + c.y - b.cy,
  };
}
export function mirrored(
  o: Instance,
  axis: "x" | "y",
  center: { x: number; y: number },
): Instance {
  return {
    ...o,
    x: axis === "x" ? 2 * center.x - o.x : o.x,
    y: axis === "y" ? 2 * center.y - o.y : o.y,
    rotation: -o.rotation,
    flipX: axis === "x" ? !o.flipX : o.flipX,
    flipY: axis === "y" ? !o.flipY : o.flipY,
  };
}
export function aligned(
  o: Instance,
  region: Paths,
  edge: "left" | "right" | "top" | "bottom",
): Instance {
  const b = bounds(transform(o)),
    r = bounds(region);
  return {
    ...o,
    x:
      o.x +
      (edge === "left"
        ? r.x - b.x
        : edge === "right"
          ? r.x + r.width - b.x - b.width
          : 0),
    y:
      o.y +
      (edge === "top"
        ? r.y - b.y
        : edge === "bottom"
          ? r.y + r.height - b.y - b.height
          : 0),
  };
}
export function snapPoint(
  x: number,
  y: number,
  step: number,
  targets: { x: number; y: number }[],
  threshold: number,
) {
  let sx = Math.round(x / step) * step,
    sy = Math.round(y / step) * step;
  let gx: number | undefined, gy: number | undefined;
  const tx = targets.toSorted(
      (a, b) => Math.abs(a.x - x) - Math.abs(b.x - x),
    )[0],
    ty = targets.toSorted((a, b) => Math.abs(a.y - y) - Math.abs(b.y - y))[0];
  if (tx && Math.abs(tx.x - x) <= threshold) {
    sx = tx.x;
    gx = sx;
  }
  if (ty && Math.abs(ty.y - y) <= threshold) {
    sy = ty.y;
    gy = sy;
  }
  return { x: sx, y: sy, gx, gy };
}
export function instance(assetId: string, x = 0, y = 0): Instance {
  return {
    id: crypto.randomUUID(),
    assetId,
    x,
    y,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    locked: false,
    visible: true,
    bottom: true,
    top: true,
  };
}
