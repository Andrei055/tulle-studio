import legacy from './assets.json';
import designs from './designs.json';
import type {Paths} from '../geometry/polygons';
export type Asset={id:string;name:string;category:string;tags:string[];paths:Paths;preview:string;license:string;revision:number;viewBox:number[];description?:string;minFeature?:number};
export const assets=designs as Asset[];
export const assetById=(id:string)=>{const a=[...assets,...legacy as Asset[]].find(a=>a.id===id);if(!a)throw new Error(`Неизвестный орнамент: ${id}`);return a;};
