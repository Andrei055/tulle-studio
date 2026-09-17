import fontData from '../library/lettering-font.json';
import type {Project} from '../domain/project';
import {boolean,bounds,offset,rect,union,type Paths,type Point} from './polygons';
const font=fontData as {units:number;glyphs:Record<string,{advance:number;paths:Paths}>;kerning:Record<string,number>};
export function letteringGeometry(p:Project,base:Paths,center:Point){
 const t=p.lettering;const empty={paths:[] as Paths,clear:[] as Paths,missing:[] as string[],fitted:false};
 if(!t.enabled||!t.text.trim())return empty;
 const lines=t.text.replace(/\r/g,'').split('\n').slice(0,3),missing=new Set<string>();let raw:Paths=[];
 lines.forEach((line,lineIndex)=>{let x=0;const row:Paths=[];let previous='';for(const char of line){const glyph=font.glyphs[char];if(!glyph){missing.add(char);continue;}x+=font.kerning[previous+char]??0;row.push(...glyph.paths.map(r=>r.map(v=>({X:v.X+x,Y:v.Y+lineIndex*110}))));x+=glyph.advance;previous=char;}const b=bounds(row);raw.push(...row.map(r=>r.map(v=>({X:v.X-b.cx,Y:v.Y}))));});
 if(!raw.length)return {...empty,missing:[...missing]};
 const b=bounds(raw),scale=t.size/font.units;raw=raw.map(r=>r.map(v=>({X:(v.X-b.cx)*scale,Y:(v.Y-b.cy)*scale})));
 if(t.stroke)raw=offset(raw,t.stroke);
 raw=union(raw,raw); // Resolve overlaps between connected script letters.
 const angle=t.rotation*Math.PI/180;const rotate=(v:Point,a:number)=>({X:v.X*Math.cos(a)-v.Y*Math.sin(a),Y:v.X*Math.sin(a)+v.Y*Math.cos(a)});
 raw=raw.map(r=>r.map(v=>rotate(v,angle)));const rotated=bounds(raw);
 const margin=p.envelope.foldWidth/2+p.envelope.borderWidth+3+t.clearance;
 const maxW=Math.max(5,p.envelope.width-2*margin),maxH=Math.max(5,p.envelope.height-2*margin);
 const fit=Math.min(1,maxW/rotated.width,maxH/rotated.height);raw=raw.map(r=>r.map(v=>({X:v.X*fit,Y:v.Y*fit})));
 const box=bounds(raw),x=Math.max(-maxW/2-box.x,Math.min(maxW/2-box.x-box.width,t.x)),y=Math.max(-maxH/2-box.y,Math.min(maxH/2-box.y-box.height,t.y));
 const place=(paths:Paths)=>paths.map(r=>r.map(v=>{const q=rotate({X:v.X+x,Y:v.Y+y},p.envelope.layoutRotation*Math.PI/180);return {X:q.X+center.X,Y:q.Y+center.Y};}));
 const r=Math.min(3,t.clearance),clear=offset(rect(box.x-t.clearance+r,box.y-t.clearance+r,box.width+2*(t.clearance-r),box.height+2*(t.clearance-r)),r);
 const safe=offset(base,-p.envelope.foldWidth/2-p.envelope.borderWidth-1);
 return {paths:boolean(place(raw),safe,'intersection'),clear:boolean(place(clear),safe,'intersection'),missing:[...missing],fitted:fit<.999||Math.abs(x-t.x)>.01||Math.abs(y-t.y)>.01};
}
