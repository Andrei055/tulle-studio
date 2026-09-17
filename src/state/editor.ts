import { create } from "zustand";
import {
  defaultProject,
  type Project,
  type Instance,
  projectSchema,
} from "../domain/project";
import { preset } from "../geometry/presets";
import { heights } from "../manufacturing/model";
type Editor = {
  project: Project;
  past: Project[];
  future: Project[];
  selection: string[];
  mode: "2d" | "3d";
  grid: boolean;
  guides: boolean;
  snap: boolean;
  gridStep: number;
  zoom: number;
  pan: { x: number; y: number };
  tool: "select" | "pan";
  error: string;
  commit: (fn: (p: Project) => void) => void;
  replace: (p: Project) => void;
  select: (ids: string[]) => void;
  patchInstances: (patch: Partial<Instance>) => void;
  undo: () => void;
  redo: () => void;
  begin: () => void;
  live: (fn: (p: Project) => void) => void;
  end: () => void;
  set: (s: Partial<Editor>) => void;
};
let transaction: Project | null = null;
function normalize(p: Project) {
  if (p.print.resumeAuto)
    p.print.recommendedResumeZ = Number(heights(p.print).resume.toFixed(4));
  return projectSchema.parse(p);
}
export const useEditor = create<Editor>((set, get) => ({
  project: structuredClone(defaultProject),
  past: [],
  future: [],
  selection: [],
  mode: "2d",
  grid: false,
  guides: false,
  snap: true,
  gridStep: 1,
  zoom: 1,
  pan: { x: 0, y: 0 },
  tool: "select",
  error: "",
  set: (s) => set(s),
  select: (ids) => set({ selection: ids }),
  commit: (fn) => {
    const s = get(),
      p = structuredClone(s.project);
    try {
      fn(p);
      set({
        project: normalize(p),
        past: [...s.past.slice(-49), s.project],
        future: [],
        error: "",
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Некорректные параметры" });
    }
  },
  replace: (p) => {
    const s = get();
    set({
      project: normalize(p),
      past: [...s.past.slice(-49), s.project],
      future: [],
      selection: [],
      error: "",
    });
  },
  patchInstances: (patch) =>
    get().commit((p) => {
      p.ornaments = p.ornaments.map((o) =>
        get().selection.includes(o.id) &&
        !o.locked &&
        !p.layers.ornaments.locked
          ? { ...o, ...patch }
          : o,
      );
    }),
  undo: () => {
    const s = get();
    if (s.past.length)
      set({
        project: s.past.at(-1)!,
        past: s.past.slice(0, -1),
        future: [s.project, ...s.future],
        selection: [],
      });
  },
  redo: () => {
    const s = get();
    if (s.future.length)
      set({
        project: s.future[0],
        past: [...s.past, s.project],
        future: s.future.slice(1),
        selection: [],
      });
  },
  begin: () => {
    transaction = structuredClone(get().project);
  },
  live: (fn) => {
    const p = structuredClone(get().project);
    try {
      fn(p);
      set({ project: normalize(p) });
    } catch {
      /* Out of editor bounds: keep last valid position. */
    }
  },
  end: () => {
    if (
      transaction &&
      JSON.stringify(transaction) !== JSON.stringify(get().project)
    )
      set({ past: [...get().past.slice(-49), transaction], future: [] });
    transaction = null;
  },
}));
export function initialize() {
  useEditor.setState({ project: preset("vienna") });
}
