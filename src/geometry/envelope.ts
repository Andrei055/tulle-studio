import type { Envelope, Project } from '../domain/project';
import { boolean, offset, union, rect, positive, area, bounds, type Point, type Paths } from './polygons';
import { transform } from './transforms';
export type PanelId='base'|'top'|'right'|'bottom'|'left';
export type Panel={id:PanelId;name:string;outer:Paths;solid:Paths;hinge?:[Point,Point]};
const names={base:'Основание',top:'Верхний клапан',right:'Правый клапан',bottom:'Нижний клапан',left:'Левый клапан'};
function edge(a:Point,b:Point,e:Envelope):Point[]{const dx=b.X-a.X,dy=b.Y-a.Y,len=Math.hypot(dx,dy);const waves=Math.max(1,Math.round(len/e.width*e.waves)),n=e.contour==='wave'?waves*e.density:1;return Array.from({length:n},(_,i)=>{const t=i/n,fade=Math.min(1,t*10,(1-t)*10),d=e.contour==='wave'?e.amplitude*(1-Math.cos(2*Math.PI*waves*t+e.phase*Math.PI/180))/2*fade:0;return {X:a.X+dx*t-dy/len*d,Y:a.Y+dy*t+dx/len*d};});}
function flap(a:Point,b:Point,depth:number,e:Envelope):Paths{const dx=b.X-a.X,dy=b.Y-a.Y,len=Math.hypot(dx,dy),nx=dy/len,ny=-dx/len;const tip={X:(a.X+b.X)/2+nx*depth,Y:(a.Y+b.Y)/2+ny*depth};
 if(e.flapShape==='triangle')return [positive([...edge(a,tip,e),...edge(tip,b,e),b])];
 if(e.flapShape==='straight'){const p={X:a.X+dx*.18+nx*depth,Y:a.Y+dy*.18+ny*depth},q={X:b.X-dx*.18+nx*depth,Y:b.Y-dy*.18+ny*depth};return [positive([...edge(a,p,e),...edge(p,q,e),...edge(q,b,e),b])];}
 const n=Math.max(48,e.waves*e.density);const pts=Array.from({length:n+1},(_,i)=>{const t=i/n,bulge=Math.sin(Math.PI*t),fade=Math.min(1,t*10,(1-t)*10,Math.abs(t-.5)*10);const wave=e.contour==='wave'?e.amplitude*(1-Math.cos(2*Math.PI*e.waves*t+e.phase*Math.PI/180))/2*fade:0;return {X:a.X+dx*t+nx*(depth*bulge-wave),Y:a.Y+dy*t+ny*(depth*bulge-wave)};});return [positive(pts)];
}
export function envelopeGeometry(e:Envelope){const w=e.width/2,h=e.height/2;const corners=[{X:-w,Y:-h},{X:w,Y:-h},{X:w,Y:h},{X:-w,Y:h}];const ids=['top','right','bottom','left'] as const;const depths=[e.flapHeight,e.sideFlapDepth,e.bottomFlapDepth,e.sideFlapDepth];
 const local=[{id:'base' as PanelId,outer:rect(-w,-h,e.width,e.height),hinge:undefined as [Point,Point]|undefined},...ids.map((id,i)=>({id,outer:flap(corners[i],corners[(i+1)%4],depths[i],e),hinge:[corners[i],corners[(i+1)%4]] as [Point,Point]}))];
 const r=e.layoutRotation*Math.PI/180;const rotate=(p:Point)=>({X:p.X*Math.cos(r)-p.Y*Math.sin(r),Y:p.X*Math.sin(r)+p.Y*Math.cos(r)});const rotated=local.map(p=>({...p,outer:p.outer.map(r=>r.map(rotate))}));const box=bounds(rotated.flatMap(p=>p.outer));const position=(p:Point)=>({X:p.X-box.x,Y:p.Y-box.y});const world=(p:Point)=>position(rotate(p));const convert=(paths:Paths)=>paths.map(r=>r.map(world));
 const foldZones=union(...corners.map((a,i)=>{const b=corners[(i+1)%4];return Math.abs(a.Y-b.Y)<.01?convert(rect(Math.min(a.X,b.X)-e.foldWidth/2,a.Y-e.foldWidth/2,Math.abs(b.X-a.X)+e.foldWidth,e.foldWidth)):convert(rect(a.X-e.foldWidth/2,Math.min(a.Y,b.Y)-e.foldWidth/2,e.foldWidth,Math.abs(b.Y-a.Y)+e.foldWidth));}));
 const closing=e.closingWidth?convert(rect(-e.closingWidth,-h-e.flapHeight,e.closingWidth*2,e.closingWidth)):[];
 const keepOut=union(foldZones,closing);
 const panels:Panel[]=rotated.map(p=>{const outer=p.outer.map(r=>r.map(position));return {id:p.id,name:names[p.id],outer,solid:boolean(outer,keepOut,'difference'),hinge:p.hinge?.map(world) as [Point,Point]|undefined};});
 const outer=union(...panels.map(p=>p.outer));const border=union(...panels.map(p=>boolean(p.solid,offset(p.solid,-e.borderWidth),'difference')));const allowed=union(...panels.map(p=>offset(p.solid,-e.borderWidth-e.edgeClearance)));
 return {outer,border,allowed,keepOut,foldZones,panels,base:panels[0].outer,center:world({X:0,Y:0}),width:box.width,total:box.height};
}
export function contour(e:Envelope){return envelopeGeometry(e).outer;}
export function buildGeometry(p:Project){const g=envelopeGeometry(p.envelope);const items=p.ornaments.map(o=>{const raw=transform(o);return {id:o.id,raw,paths:boolean(raw,g.allowed,'intersection')};});const visible=items.filter(i=>p.ornaments.find(o=>o.id===i.id)?.visible);const border=p.layers.border.visible?g.border:[];
 const make=(side:'bottom'|'top')=>union(border,...(p.layers.ornaments.visible?visible.filter(i=>p.ornaments.find(o=>o.id===i.id)?.[side]).map(i=>i.paths):[]));const bottom=make('bottom'),top=make('top');const warnings:string[]=[];if(!bottom.length&&!top.length)warnings.push('Нет геометрии PLA для экспорта.');
 if(p.ornaments.length===1){const b=bounds(items[0].raw),a=bounds(g.allowed);if(b.x>a.x||b.y>a.y||b.x+b.width<a.x+a.width||b.y+b.height<a.y+a.height)warnings.push('Полотно не покрывает край развёртки. Уменьшите сдвиг или увеличьте масштаб.');}
 return {...g,items,bottom,top,warnings};}
export type Geometry=ReturnType<typeof buildGeometry>;
