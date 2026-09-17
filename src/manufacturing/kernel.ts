import Module, {type ManifoldToplevel} from 'manifold-3d';
import type {Paths} from '../geometry/polygons';
let kernel:ManifoldToplevel|undefined;
let pending:Promise<void>|undefined;
export function initializeKernel(){
  return pending??=(async()=>{const module=await Module(typeof window==='undefined'?undefined:{locateFile:()=>'/vendor/manifold.wasm'});module.setup();kernel=module;})().catch(error=>{pending=undefined;throw error;});
}
// A 5 µm inward tolerance separates point contacts without closing fabric hinges.
// Both SVG and STL use this exact section; triangulation tolerance is 1 µm.
export const SECTION_INSET=.005;
export function manufacturingSection(paths:Paths){
  if(!kernel)throw new Error('Геометрическое ядро ещё загружается');
  const source=new kernel.CrossSection(paths.map(r=>r.map(v=>[v.X,-v.Y] as [number,number])),'NonZero');
  try{return source.offset(-SECTION_INSET,'Round');}finally{source.delete();}
}
export function manufacturingPaths(paths:Paths):Paths{
  const section=manufacturingSection(paths);
  try{return section.toPolygons().map(r=>r.map(([X,y])=>({X,Y:-y})));}finally{section.delete();}
}
