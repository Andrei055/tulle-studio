import { describe, it, expect } from "vitest";
import { defaultProject, parseProject } from "../src/domain/project";
import { envelopeGeometry, buildGeometry } from "../src/geometry/envelope";
import {
  bounds,
  area,
  boolean,
  centroid,
  rect,
} from "../src/geometry/polygons";
import {
  instance,
  transform,
  mirrored,
  centered,
  snapPoint,
} from "../src/geometry/transforms";
import { preset } from "../src/geometry/presets";
import { extrude, meshAudit, heights } from "../src/manufacturing/model";
import { projectFromJSON, svgFile, stlFile } from "../src/export/files";
const base = () => structuredClone(defaultProject);
describe("Manufacturing geometry", () => {
  it.each(["straight", "wave"] as const)(
    "preserves dimensions: %s",
    (contour) => {
      const e = { ...base().envelope, contour };
      const b = bounds(envelopeGeometry(e).outer);
      expect(b.width).toBeCloseTo(e.width, 2);
      expect(b.height).toBeCloseTo(e.height + e.flapHeight + e.pocketHeight, 2);
    },
  );
  it("has exactly specified straight border thickness", () => {
    const e = {
      ...base().envelope,
      contour: "straight" as const,
      flapShape: "straight" as const,
    };
    const g = envelopeGeometry(e);
    expect(
      area(boolean(g.border, rect(0, 60, e.borderWidth, 10), "intersection")),
    ).toBeCloseTo(e.borderWidth * 10, 3);
    expect(
      area(
        boolean(
          g.border,
          rect(e.borderWidth + 0.01, 60, 5, 10),
          "intersection",
        ),
      ),
    ).toBe(0);
  });
  it("clips motifs and removes PLA from full-width folds", () => {
    const p = base();
    p.ornaments = [
      { ...instance("flower", 2, p.envelope.flapHeight), scaleX: 3, scaleY: 3 },
    ];
    const g = buildGeometry(p);
    expect(
      area(boolean(g.items[0].paths, g.allowed, "difference")),
    ).toBeLessThan(0.001);
    expect(area(boolean(g.bottom, g.keepOut, "intersection"))).toBe(0);
    expect(area(boolean(g.top, g.keepOut, "intersection"))).toBe(0);
  });
  it.each(["x", "y"] as const)(
    "exact mirror about %s including rotated asymmetric assets",
    (axis) => {
      const o = {
        ...instance("branch", 32, 61),
        rotation: 31,
        scaleX: 1.3,
        flipY: true,
      };
      const c = { x: 90, y: 87 };
      const a = transform(o).flat(),
        b = transform(mirrored(o, axis, c)).flat();
      const expected = a.map((v) => ({
        X: axis === "x" ? 2 * c.x - v.X : v.X,
        Y: axis === "y" ? 2 * c.y - v.Y : v.Y,
      }));
      for (const v of expected)
        expect(b.some((q) => Math.hypot(q.X - v.X, q.Y - v.Y) < 1e-8)).toBe(
          true,
        );
    },
  );
  it("centers transformed bounds on actual asymmetric area centroid", () => {
    const region = [
      [
        { X: 0, Y: 0 },
        { X: 100, Y: 0 },
        { X: 0, Y: 60 },
      ],
    ];
    const c = centroid(region);
    expect(c.x).toBeCloseTo(100 / 3, 7);
    const o = centered({ ...instance("corner"), rotation: 32 }, region, "both"),
      b = bounds(transform(o));
    expect(b.cx).toBeCloseTo(c.x, 7);
    expect(b.cy).toBeCloseTo(c.y, 7);
  });
  it("snaps to grid then closer guide", () => {
    expect(snapPoint(10.3, 15.7, 1, [], 0.4)).toMatchObject({ x: 10, y: 16 });
    expect(snapPoint(10.3, 15.7, 1, [{ x: 10.5, y: 15.5 }], 0.4)).toMatchObject(
      { x: 10.5, y: 15.5 },
    );
  });
  it.each(["floral", "minimal", "branches"] as const)(
    "extrudes closed positive-volume meshes for %s",
    (kind) => {
      const p = preset(kind),
        g = buildGeometry(p),
        h = heights(p.print);
      for (const side of ["bottom", "top"] as const) {
        const mesh = extrude(g[side], h[side]);
        const audit = meshAudit(mesh);
        expect(audit.nonfinite).toBe(0);
        expect(audit.degenerate).toBe(0);
        expect(audit.badEdges).toBe(0);
        expect(audit.volume).toBeCloseTo(area(g[side]) * h[side], 1);
        mesh.dispose();
      }
    },
  );
  it("keeps holes open and extrudes expected volume", () => {
    const paths = boolean(rect(0, 0, 20, 10), rect(2, 2, 16, 6), "difference");
    const m = extrude(paths, 0.8);
    expect(meshAudit(m)).toMatchObject({ badEdges: 0, degenerate: 0 });
    expect(meshAudit(m).volume).toBeCloseTo(83.2, 3);
    m.dispose();
  });
  it("rebuilds rather than CSS-scaling", () => {
    const p = base(),
      a = buildGeometry(p);
    p.envelope.width = 220;
    const b = buildGeometry(p);
    expect(bounds(b.outer).width - bounds(a.outer).width).toBeCloseTo(40, 3);
    expect(area(b.border)).not.toBe(area(a.border));
  });
  it("separates bottom and top inclusion", () => {
    const p = base();
    p.layers.border.visible = false;
    p.ornaments = [{ ...instance("flower", 90, 85), top: false }];
    const g = buildGeometry(p);
    expect(area(g.bottom)).toBeGreaterThan(0);
    expect(area(g.top)).toBe(0);
  });
  it("round-trips editable JSON and rejects corrupt projects", () => {
    const p = preset("floral");
    expect(projectFromJSON(JSON.stringify(p))).toEqual(p);
    expect(() => parseProject({ ...p, version: 2 })).toThrow();
    expect(() =>
      projectFromJSON(
        JSON.stringify({
          ...p,
          ornaments: [{ ...p.ornaments[0], assetId: "unknown" }],
        }),
      ),
    ).toThrow();
    expect(() =>
      parseProject({ ...p, envelope: { ...p.envelope, width: -1 } }),
    ).toThrow();
  });
  it("exports real mm SVG and binary STL with expected triangle length", () => {
    const p = preset("minimal"),
      svg = svgFile(p);
    expect(svg).toContain('width="180mm"');
    expect(svg).not.toContain("clipPath");
    const data = stlFile(p);
    expect(data.byteLength).toBe(84 + data.getUint32(80, true) * 50);
  });
  it("calculates resume nozzle Z independently of top mesh base", () => {
    const h = heights(base().print);
    expect(h.bottom).toBeCloseTo(0.4);
    expect(h.topStart).toBeCloseTo(0.52);
    expect(h.resume).toBeCloseTo(0.72);
  });
});

describe("Contour parameter variations", () => {
  for (const flapShape of ["straight", "triangle", "round"] as const)
    for (const contour of ["straight", "wave"] as const)
      for (const phase of [0, 137, 270]) {
        it(`${flapShape}/${contour}/phase=${phase} keeps nominal bounds and printable solids`, () => {
          const p = base();
          p.envelope = {
            ...p.envelope,
            flapShape,
            contour,
            phase,
            width: 165,
            height: 80,
            pocketHeight: 60,
            flapHeight: 40,
            amplitude: 3,
          };
          const g = buildGeometry(p),
            b = bounds(g.outer);
          expect(b.width).toBeCloseTo(165, 2);
          expect(b.height).toBeCloseTo(180, 2);
          expect(area(boolean(g.bottom, g.keepOut, "intersection"))).toBe(0);
          const m = extrude(g.bottom, 0.4);
          const a = meshAudit(m);
          expect(a.badEdges).toBe(0);
          expect(a.degenerate).toBe(0);
          m.dispose();
        });
      }
});
