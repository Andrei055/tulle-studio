import ClipperLib from "clipper-lib";
export type Point = { X: number; Y: number };
export type Paths = Point[][];
export type Polygon = { outer: Point[]; holes: Point[][] };
export const SCALE = 1000;
const integer = (paths: Paths) =>
  paths.map((p) =>
    p.map((v) => ({ X: Math.round(v.X * SCALE), Y: Math.round(v.Y * SCALE) })),
  );
const decimal = (paths: Paths) =>
  paths.map((p) => p.map((v) => ({ X: v.X / SCALE, Y: v.Y / SCALE })));
export function signedArea(p: Point[]) {
  return (
    p.reduce((a, v, i) => {
      const q = p[(i + 1) % p.length];
      return a + v.X * q.Y - q.X * v.Y;
    }, 0) / 2
  );
}
export function area(p: Paths) {
  return Math.abs(p.reduce((a, r) => a + signedArea(r), 0));
}
export function positive(p: Point[]) {
  return signedArea(p) < 0 ? [...p].reverse() : p;
}
export function rect(x: number, y: number, w: number, h: number): Paths {
  return [
    [
      { X: x, Y: y },
      { X: x + w, Y: y },
      { X: x + w, Y: y + h },
      { X: x, Y: y + h },
    ],
  ];
}
export function boolean(
  a: Paths,
  b: Paths,
  op: "union" | "difference" | "intersection",
): Paths {
  if (!a.length) return op === "union" ? b : [];
  if (!b.length) return op === "intersection" ? [] : a;
  const c = new ClipperLib.Clipper();
  c.StrictlySimple = true;
  c.AddPaths(integer(a), ClipperLib.PolyType.ptSubject, true);
  c.AddPaths(integer(b), ClipperLib.PolyType.ptClip, true);
  const out: Paths = [];
  const types = {
    union: ClipperLib.ClipType.ctUnion,
    difference: ClipperLib.ClipType.ctDifference,
    intersection: ClipperLib.ClipType.ctIntersection,
  };
  c.Execute(
    types[op],
    out,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  return decimal(out);
}
export function union(...sets: Paths[]): Paths {
  return sets.reduce((a, b) => boolean(a, b, "union"), [] as Paths);
}
export function offset(paths: Paths, delta: number): Paths {
  if (!paths.length) return [];
  const c = new ClipperLib.ClipperOffset(2, 20);
  c.AddPaths(
    integer(paths),
    ClipperLib.JoinType.jtRound,
    ClipperLib.EndType.etClosedPolygon,
  );
  const out: Paths = [];
  c.Execute(out, delta * SCALE);
  return decimal(out);
}
export function polygons(paths: Paths): Polygon[] {
  const c = new ClipperLib.Clipper();
  c.StrictlySimple = true;
  c.AddPaths(integer(paths), ClipperLib.PolyType.ptSubject, true);
  const tree = new ClipperLib.PolyTree();
  c.Execute(
    ClipperLib.ClipType.ctUnion,
    tree,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  const out: Polygon[] = [];
  const walk = (n: ClipperLib.PolyNode) => {
    if (n.Contour().length && !n.IsHole())
      out.push({
        outer: decimal([n.Contour()])[0],
        holes: decimal(
          n
            .Childs()
            .filter((x) => x.IsHole())
            .map((x) => x.Contour()),
        ),
      });
    n.Childs().forEach(walk);
  };
  walk(tree);
  return out;
}
export function bounds(paths: Paths) {
  let x=Infinity,y=Infinity,right=-Infinity,bottom=-Infinity;
  for(const ring of paths)for(const p of ring){x=Math.min(x,p.X);y=Math.min(y,p.Y);right=Math.max(right,p.X);bottom=Math.max(bottom,p.Y);}
  if(!Number.isFinite(x))return {x:0,y:0,width:0,height:0,cx:0,cy:0};
  const width=right-x,height=bottom-y;
  return {x,y,width,height,cx:x+width/2,cy:y+height/2};
}
export function centroid(paths: Paths) {
  let a = 0,
    x = 0,
    y = 0;
  for (const p of paths)
    for (let i = 0; i < p.length; i++) {
      const v = p[i],
        q = p[(i + 1) % p.length],
        c = v.X * q.Y - q.X * v.Y;
      a += c;
      x += (v.X + q.X) * c;
      y += (v.Y + q.Y) * c;
    }
  if (Math.abs(a) < 1e-8) {
    const b = bounds(paths);
    return { x: b.cx, y: b.cy };
  }
  return { x: x / (3 * a), y: y / (3 * a) };
}
export function pathData(paths: Paths) {
  return paths
    .map(
      (r) =>
        r
          .map((p, i) => `${i ? "L" : "M"}${p.X.toFixed(3)},${p.Y.toFixed(3)}`)
          .join(" ") + "Z",
    )
    .join(" ");
}
