'use client';
import {useMemo,useRef,useState,type PointerEvent as PE} from 'react';
import {useEditor} from '../state/editor';
import type {Geometry} from '../geometry/envelope';
import {pathData,bounds,centroid,type Paths} from '../geometry/polygons';
import {assetById} from '../library';
import {snapPoint} from '../geometry/transforms';
import type {Instance} from '../domain/project';
const pathCache=new Map<string,string>();
function drawing(id:string){if(!pathCache.has(id))pathCache.set(id,pathData(assetById(id).paths));return pathCache.get(id)!;}
function matrix(o:Instance){const a=assetById(o.assetId),b=bounds(a.paths),r=o.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),sx=o.scaleX*(o.flipX?-1:1),sy=o.scaleY*(o.flipY?-1:1);return `matrix(${c*sx} ${s*sx} ${-s*sy} ${c*sy} ${o.x-c*sx*b.cx+s*sy*b.cy} ${o.y-s*sx*b.cx-c*sy*b.cy})`;}
export function Canvas2D({geometry:g,region}:{geometry:Geometry;region:Paths}){const s=useEditor(),svg=useRef<SVGSVGElement>(null),drag=useRef<{x:number;y:number;pan:boolean;item?:Instance}|null>(null);const [draft,setDraft]=useState<Instance|null>(null),draftRef=useRef<Instance|null>(null),[smart,setSmart]=useState<{gx?:number;gy?:number}>({});
 const W=g.width+32,H=g.total+34,vw=W/s.zoom,vh=H/s.zoom,vx=-16+(W-vw)/2+s.pan.x,vy=-17+(H-vh)/2+s.pan.y;const paths=useMemo(()=>({outer:pathData(g.outer),allowed:pathData(g.drawingAllowed),border:pathData(g.border),keep:pathData(g.foldZones)}),[g]);
 const point=(ev:PE<SVGSVGElement>)=>{const p=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse());return {x:p.x,y:p.y};};
 function start(ev:PE<SVGSVGElement>){if(ev.button!==0&&ev.button!==1)return;const p=point(ev),pan=s.tool==='pan'||ev.button===1;const o=s.project.ornaments[0];if(!pan&&(!o||o.locked||s.project.layers.ornaments.locked))return;drag.current={...p,pan,item:o};if(o&&!pan)s.select([o.id]);svg.current?.setPointerCapture(ev.pointerId);}
 function move(ev:PE<SVGSVGElement>){const d=drag.current;if(!d)return;const p=point(ev);if(d.pan){s.set({pan:{x:s.pan.x+d.x-p.x,y:s.pan.y+d.y-p.y}});return;}if(!d.item)return;let x=d.item.x+p.x-d.x,y=d.item.y+p.y-d.y;if(s.snap){const snapped=snapPoint(x,y,s.gridStep,[{x:g.center.X,y:g.center.Y}],2/s.zoom);x=snapped.x;y=snapped.y;setSmart(snapped);}const next={...d.item,x:Math.max(-600,Math.min(900,x)),y:Math.max(-600,Math.min(900,y))};draftRef.current=next;setDraft(next);}
 function end(){const next=draftRef.current;if(next)s.commit(p=>{const i=p.ornaments.findIndex(o=>o.id===next.id);if(i>=0)p.ornaments[i]=next;});drag.current=null;draftRef.current=null;setDraft(null);setSmart({});}
 const c=centroid(region),ref=s.project.reference;
 return <div className="canvas-wrap lace-canvas"><svg ref={svg} aria-label="Развёртка: основание и четыре клапана" className={'editor-svg '+(s.tool==='pan'?'panning':'pattern-moving')} viewBox={`${vx} ${vy} ${vw} ${vh}`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;draftRef.current=null;setDraft(null);}} onWheel={ev=>s.set({zoom:Math.max(.4,Math.min(4,s.zoom*Math.exp(-ev.deltaY*.001)))})}>
 <defs><clipPath id="decoration-clip"><path d={paths.allowed}/></clipPath><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#b9b9b2" strokeWidth=".15"/></pattern><pattern id="tulle-mesh" width=".55" height=".55" patternUnits="userSpaceOnUse"><path d="M0 0L.55 .55M.55 0L0 .55" stroke="#a49e9c" strokeWidth=".025"/></pattern></defs>
 {s.grid&&<rect x={vx-500} y={vy-500} width="1500" height="1500" fill="url(#grid)"/>}
 {ref&&<image href={ref.dataUrl} x={ref.x} y={ref.y} width={ref.width} opacity={ref.opacity} transform={`rotate(${ref.rotation} ${ref.x+ref.width/2} ${ref.y})`} pointerEvents="none"/>}
 <path d={paths.outer} fill="#625b60"/>{s.project.layers.fabric.visible&&<path d={paths.outer} fill="url(#tulle-mesh)"/>}
 {s.project.layers.border.visible&&<path d={paths.border} fill="#fff8eb"/>}
 {s.project.layers.ornaments.visible&&<g clipPath="url(#decoration-clip)" fill="#fff8eb" fillRule="nonzero">{s.project.ornaments.filter(o=>o.visible).map(o=><path key={o.id} d={drawing(o.assetId)} transform={matrix(draft?.id===o.id?draft:o)}/>)}</g>}
 <path d={pathData(g.lettering.paths)} fill="#fff8eb"/>
 {s.guides&&<g pointerEvents="none">{g.panels.map((panel,i)=>{const c=centroid(panel.outer);if(panel.id==='base'&&s.project.lettering.enabled){const v=panel.outer[0][0];c.x=v.X*.85+c.x*.15;c.y=v.Y*.85+c.y*.15;}return <g key={panel.id}>{panel.hinge&&<path d={`M${panel.hinge[0].X} ${panel.hinge[0].Y}L${panel.hinge[1].X} ${panel.hinge[1].Y}`} stroke="#d19bad" strokeWidth=".4" strokeDasharray="2 1.5"/>}<circle cx={c.x} cy={c.y} r="3.5" fill="#fff6eb" stroke="#85606f" strokeWidth=".3"/><text x={c.x} y={c.y+1.1} textAnchor="middle" fontSize="3.2" fill="#654551">{({base:1,left:2,right:3,bottom:4,top:5})[panel.id]}</text></g>;})}<path d={`M${c.x} -2V${g.total+2}M-2 ${c.y}H${g.width+2}`} stroke="#d19bad" strokeWidth=".22" opacity=".65" strokeDasharray="1.5 2"/></g>}
 <g className="dimensions" pointerEvents="none"><path d={`M0 -7H${g.width}M0 -9V-5M${g.width} -9V-5M-8 0V${g.total}M-10 0H-6M-10 ${g.total}H-6`} stroke="#91817e" strokeWidth=".2"/><text x={g.width/2} y="-10" textAnchor="middle">{g.width.toFixed(1)} мм · на столе</text><text x="-11" y={g.total/2} textAnchor="middle" transform={`rotate(-90 -11 ${g.total/2})`}>{g.total.toFixed(1)} мм</text></g>
 {smart.gx!==undefined&&<path d={`M${smart.gx} 0V${g.total}`} stroke="#e09fb5" strokeWidth=".5" pointerEvents="none"/>}{smart.gy!==undefined&&<path d={`M0 ${smart.gy}H${g.width}`} stroke="#e09fb5" strokeWidth=".5" pointerEvents="none"/>}
 </svg><div className="canvas-bottom"><span>{draft?'Перемещаем всё полотно…':'Потяните за рисунок, чтобы изменить композицию'}</span><span>5 частей · 4 сгиба</span></div></div>;
}
