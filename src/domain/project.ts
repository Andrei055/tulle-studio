import { z } from "zod";
const mm = (min: number, max: number) => z.number().finite().min(min).max(max);
export const envelopeSchema = z
  .object({
    width: mm(80, 300),
    height: mm(50, 150),
    bottomFlapDepth: mm(20, 150),
    sideFlapDepth: mm(15, 150),
    layoutRotation: mm(0, 90),
    flapHeight: mm(20, 150),
    flapShape: z.enum(["straight", "triangle", "round"]),
    contour: z.enum(["straight", "wave"]),
    borderWidth: mm(0.8, 8),
    edgeClearance: mm(0, 10),
    foldWidth: mm(1, 12),
    closingWidth: mm(0, 12),
    amplitude: mm(0, 6),
    waves: z.number().int().min(2).max(30),
    phase: mm(0, 360),
    density: z.number().int().min(8).max(48),
  })
  ;
export const instanceSchema = z.object({
  id: z.string().min(1).max(100),
  assetId: z.string().min(1).max(100),
  x: mm(-600, 900),
  y: mm(-600, 900),
  scaleX: mm(0.1, 8),
  scaleY: mm(0.1, 8),
  rotation: mm(-360, 360),
  flipX: z.boolean(),
  flipY: z.boolean(),
  locked: z.boolean(),
  visible: z.boolean(),
  bottom: z.boolean(),
  top: z.boolean(),
});
export const printSchema = z.object({
  printer: z.string().max(100),
  nozzleDiameter: mm(0.1, 1.2),
  firstLayerHeight: mm(0.05, 0.6),
  normalLayerHeight: mm(0.05, 0.6),
  bottomLayerCount: z.number().int().min(1).max(20),
  topLayerCount: z.number().int().min(1).max(20),
  fabricThickness: mm(0, 1),
  fabricClearance: mm(0, 1),
  pauseAfterLayer: z.number().int().min(1).max(20),
  recommendedResumeZ: mm(0.05, 20),
  resumeAuto: z.boolean(),
});
const layer = z.object({ visible: z.boolean(), locked: z.boolean() });
export const letteringSchema = z.object({
  enabled: z.boolean(), text: z.string().max(100),
  font: z.literal("great-vibes"), size: mm(6,32),
  x: mm(-120,120), y: mm(-60,60), rotation: mm(-180,180),
  stroke: mm(0,.8), clearance: mm(1,10),
});
export const defaultLettering = {enabled:true,text:"С любовью",font:"great-vibes" as const,size:20,x:0,y:0,rotation:0,stroke:.18,clearance:3};
export const projectSchema = z
  .object({
    version: z.literal(2),
    name: z.string().min(1).max(120),
    envelope: envelopeSchema,
    lettering: letteringSchema.default({...defaultLettering,enabled:false}),
    ornaments: z.array(instanceSchema).max(200),
    print: printSchema,
    layers: z.object({
      border: layer,
      ornaments: layer,
      fabric: layer,
      bottom: layer,
      top: layer,
    }),
    reference: z
      .object({
        dataUrl: z
          .string()
          .max(7000000)
          .regex(/^data:image\/(png|jpeg|webp);base64,/),
        x: mm(-600, 900),
        y: mm(-600, 900),
        width: mm(10, 600),
        rotation: mm(-360, 360),
        opacity: mm(0, 1),
      })
      .nullable(),
  })
  .superRefine((p, ctx) => {
    if (new Set(p.ornaments.map((o) => o.id)).size !== p.ornaments.length)
      ctx.addIssue({ code: "custom", message: "Повторяющиеся ID объектов" });
    if (p.print.pauseAfterLayer !== p.print.bottomLayerCount)
      ctx.addIssue({
        code: "custom",
        message: "Пауза должна завершать нижний PLA",
      });
  });
export type Project = z.infer<typeof projectSchema>;
export type Envelope = Project["envelope"];
export type Instance = z.infer<typeof instanceSchema>;
export type PrintProfile = z.infer<typeof printSchema>;
export const defaultProject: Project = {
  version: 2,
  name: "Венское кружево",
  envelope: {
    width: 180,
    height: 85,
    bottomFlapDepth: 72,
    sideFlapDepth: 58,
    layoutRotation: 45,
    flapHeight: 76,
    flapShape: "triangle",
    contour: "wave",
    borderWidth: 1.2,
    edgeClearance: 0,
    foldWidth: 3,
    closingWidth: 0,
    amplitude: 1.5,
    waves: 6,
    phase: 0,
    density: 16,
  },
  lettering: {...defaultLettering},
  ornaments: [],
  print: {
    printer: "Пользовательский FDM",
    nozzleDiameter: 0.4,
    firstLayerHeight: 0.2,
    normalLayerHeight: 0.2,
    bottomLayerCount: 2,
    topLayerCount: 2,
    fabricThickness: 0.12,
    fabricClearance: 0,
    pauseAfterLayer: 2,
    recommendedResumeZ: 0.72,
    resumeAuto: true,
  },
  layers: {
    border: { visible: true, locked: false },
    ornaments: { visible: true, locked: false },
    fabric: { visible: true, locked: false },
    bottom: { visible: true, locked: false },
    top: { visible: true, locked: false },
  },
  reference: null,
};
export function parseProject(value: unknown): Project {
  return projectSchema.parse(value);
}
// Future LLM boundary: never accept meshes, code, or G-code as DesignSpec.
export const designSpecSchema = z.object({
  version: z.literal(2),
  envelope: envelopeSchema,
  ornaments: z.array(instanceSchema).max(200),
  print: printSchema,
});
