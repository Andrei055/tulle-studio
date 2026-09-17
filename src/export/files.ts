import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { type Project, parseProject } from "../domain/project";
import { assetById } from "../library";
import { buildGeometry } from "../geometry/envelope";
import { pathData } from "../geometry/polygons";
import {
  manufacturingMeshes,
  meshAudit,
  heights,
} from "../manufacturing/model";
import { Mesh } from "three";
export function projectFromJSON(text: string) {
  if (text.length > 8000000) throw new Error("Файл проекта слишком большой");
  const p = parseProject(JSON.parse(text));
  p.ornaments.forEach((o) => assetById(o.assetId));
  return p;
}
export function svgFile(p: Project, side: "bottom" | "top" = "top") {
  const g = buildGeometry(p);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${p.envelope.width}mm" height="${g.total}mm" viewBox="0 0 ${p.envelope.width} ${g.total}"><title>Tulle Studio — ${side} PLA, mm</title><path fill="black" fill-rule="nonzero" d="${pathData(g[side])}"/></svg>`;
}
export function stlFile(p: Project, side: "all" | "bottom" | "top" = "all") {
  const group = manufacturingMeshes(p, buildGeometry(p), side);
  if (!group.children.length) throw new Error("Нет геометрии PLA");
  try {
    group.children.forEach((m) => {
      const a = meshAudit((m as Mesh).geometry);
      if (a.badEdges || a.degenerate || a.nonfinite || a.volume <= 0)
        throw new Error(
          "Геометрия не прошла проверку замкнутости. Измените параметры или композицию.",
        );
    });
    return new STLExporter().parse(group, { binary: true });
  } finally {
    group.children.forEach((m) => {
      const mesh = m as Mesh;
      mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat.dispose();
    });
  }
}
export function profileFile(p: Project) {
  return JSON.stringify(
    {
      units: "mm",
      profile: p.print,
      computed: heights(p.print),
      instructions: [
        "Импортировать STL в мм с сохранением исходных координат Z.",
        "Пауза после слоя " + p.print.pauseAfterLayer + ".",
        "Уложить ткань; настроить продолжение в слайсере. STL не содержит пауз.",
        "Проверить купон, соединение боковин и материал до печати изделия.",
      ],
    },
    null,
    2,
  );
}
export function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
