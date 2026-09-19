import legacy from './assets.json';
import designs from './designs.json';
import type {Paths} from '../geometry/polygons';
export type Asset={id:string;name:string;category:string;tags:string[];paths:Paths;preview:string;license:string;revision:number;viewBox:number[];description?:string;minFeature?:number;group?:'simple'|'dense';coverage?:number;repeatStep?:number;construction?:'motifs'};
export const assets=designs as Asset[];
const expanded=new Map<string,Asset>();
export const assetById=(id:string)=>{const cached=expanded.get(id);if(cached)return cached;const a=[...assets,...legacy as Asset[]].find(a=>a.id===id);if(!a)throw new Error(`Неизвестный орнамент: ${id}`);if(!a.repeatStep)return a;const step=a.repeatStep,n=Math.ceil(200/step-.5),paths:Paths=[];for(let y=-n;y<=n;y++)for(let x=-n;x<=n;x++)paths.push(...a.paths.map(r=>r.map(v=>({X:v.X+x*step,Y:v.Y+y*step}))));const result={...a,paths};expanded.set(id,result);return result;};
