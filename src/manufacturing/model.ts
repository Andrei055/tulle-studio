import * as THREE from "three";
import type { PrintProfile, Project } from "../domain/project";
import { polygons, bounds, type Paths } from "../geometry/polygons";
import { manufacturingSection } from "./kernel";
import type { Geometry } from "../geometry/envelope";
export function heights(p: PrintProfile) {
  const bottom =
      p.firstLayerHeight + (p.bottomLayerCount - 1) * p.normalLayerHeight,
    top = p.topLayerCount * p.normalLayerHeight,
    topStart = bottom + p.fabricThickness + p.fabricClearance;
  return {
    bottom,
    top,
    topStart,
    resume: topStart + p.normalLayerHeight,
    total: topStart + top,
  };
}
export function extrude(
  paths: Paths,
  height: number,
  z = 0,
): THREE.BufferGeometry {
  const section=manufacturingSection(paths);
  const raw=section.extrude(height);
  const solid=raw.setTolerance(.001);
  try {
    if(solid.status()!=="NoError")throw new Error("Не удалось построить замкнутую геометрию");
    const mesh=solid.getMesh(), indexed=new THREE.BufferGeometry();
    indexed.setAttribute("position",new THREE.BufferAttribute(mesh.vertProperties,3));
    indexed.setIndex(new THREE.BufferAttribute(mesh.triVerts,1));
    const geometry=indexed.toNonIndexed();indexed.dispose();
    geometry.translate(0,0,z);geometry.computeVertexNormals();return geometry;
  } finally {solid.delete();raw.delete();section.delete();}
}

export function manufacturingMeshes(
  p: Project,
  g: Geometry,
  side: "all" | "bottom" | "top" = "all",
) {
  const h = heights(p.print),
    group = new THREE.Group();
  if (side !== "top" && g.bottom.length)
    group.add(
      new THREE.Mesh(
        extrude(g.bottom, h.bottom),
        new THREE.MeshStandardMaterial(),
      ),
    );
  if (side !== "bottom" && g.top.length)
    group.add(
      new THREE.Mesh(
        extrude(g.top, h.top, h.topStart),
        new THREE.MeshStandardMaterial(),
      ),
    );
  group.updateMatrixWorld(true);
  return group;
}
export function meshAudit(geometry: THREE.BufferGeometry) {
  const p = geometry.getAttribute("position"),
    edges = new Map<string, number>();
  let volume = 0,
    degenerate = 0,
    nonfinite = 0;
  const key = (v: THREE.Vector3) =>
    [v.x, v.y, v.z].map((x) => x.toFixed(4)).join(",");
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    if (
      ![...a.toArray(), ...b.toArray(), ...c.toArray()].every(Number.isFinite)
    )
      nonfinite++;
    if (
      new THREE.Vector3()
        .subVectors(b, a)
        .cross(new THREE.Vector3().subVectors(c, a))
        .length() < 1e-8
    )
      degenerate++;
    volume += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
    const ks = [key(a), key(b), key(c)];
    for (let j = 0; j < 3; j++) {
      const e = [ks[j], ks[(j + 1) % 3]].sort().join("|");
      edges.set(e, (edges.get(e) || 0) + 1);
    }
  }
  return {
    triangles: p.count / 3,
    volume,
    degenerate,
    nonfinite,
    badEdges: [...edges.values()].filter((n) => n !== 2).length,
  };
}
export function preflight(p: Project, g: Geometry) {
  const warnings = [...g.warnings];
  const small = polygons(g.bottom).filter((poly) => {
    const b = bounds([poly.outer]);
    return Math.min(b.width, b.height) < p.print.nozzleDiameter;
  }).length;
  if (small)
    warnings.push(`${small} фрагм. уже диаметра сопла; проверьте в слайсере.`);
  return warnings;
}
