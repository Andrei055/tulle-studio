import raw from "./assets.json";
import type { Paths } from "../geometry/polygons";
export type Asset = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  paths: Paths;
  preview: string;
  license: string;
  revision: number;
  viewBox: number[];
};
export const assets = raw as Asset[];
export const assetById = (id: string) => {
  const a = assets.find((a) => a.id === id);
  if (!a) throw new Error(`Неизвестный орнамент: ${id}`);
  return a;
};
