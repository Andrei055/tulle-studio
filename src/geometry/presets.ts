import { defaultProject, type Project } from "../domain/project";
import { instance, centered, mirrored } from "./transforms";
import { envelopeGeometry } from "./envelope";
import { boolean, centroid, rect } from "./polygons";
export function preset(
  kind: "floral" | "minimal" | "branches",
  source: Project = defaultProject,
): Project {
  const p = structuredClone(source),
    e = p.envelope,
    g = envelopeGeometry(e);
  const back = boolean(
      g.allowed,
      rect(0, e.flapHeight, e.width, e.height),
      "intersection",
    ),
    c = centroid(back);
  const flower = centered(
    instance(kind === "minimal" ? "diamond" : "flower"),
    back,
    "both",
  );
  const left = instance(
    kind === "minimal" ? "diamond" : kind === "branches" ? "branch" : "leaf",
    e.width * 0.23,
    c.y,
  );
  left.rotation = kind === "floral" ? -30 : 0;
  const right = mirrored(left, "x", c);
  right.id = crypto.randomUUID();
  const flap = centered(
    instance(kind === "minimal" ? "diamond" : "flower"),
    boolean(g.allowed, rect(0, 0, e.width, e.flapHeight), "intersection"),
    "both",
  );
  flap.scaleX = flap.scaleY = 0.65;
  const pocket = boolean(
    g.allowed,
    rect(0, e.flapHeight + e.height, e.width, e.pocketHeight),
    "intersection",
  );
  const lower = centered(
    instance(kind === "branches" ? "branch" : "border"),
    pocket,
    "both",
  );
  p.ornaments = [flower, left, right, flap, lower];
  p.name = {
    floral: "Цветочное письмо",
    minimal: "Тихая геометрия",
    branches: "Ботанический этюд",
  }[kind];
  return p;
}
