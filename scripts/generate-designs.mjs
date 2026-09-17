// Original print-oriented vector master sheets. No raster tracing or runtime AI.
import C from 'clipper-lib';
import fs from 'node:fs';
const S=1000;
const V=(x,y)=>({X:x,Y:y});
const polar=(r,a)=>V(r*Math.cos(a),r*Math.sin(a));
function bezier(a,b,c,d,n=18){return Array.from({length:n+1},(_,i)=>{let t=i/n,u=1-t;return V(u*u*u*a.X+3*u*u*t*b.X+3*u*t*t*c.X+t*t*t*d.X,u*u*u*a.Y+3*u*u*t*b.Y+3*u*t*t*c.Y+t*t*t*d.Y);});}
const circle=(r,n=40)=>Array.from({length:n},(_,i)=>polar(r,i*Math.PI*2/n));
function stroke(points,width=.65,closed=false){const co=new C.ClipperOffset(2,40),out=[];co.AddPath(points.map(v=>V(Math.round(v.X*S),Math.round(v.Y*S))),C.JoinType.jtRound,closed?C.EndType.etClosedLine:C.EndType.etOpenRound);co.Execute(out,width*S/2);return out;}
function normalize(paths){const c=new C.Clipper();c.StrictlySimple=true;c.AddPaths(paths,C.PolyType.ptSubject,true);const out=[];c.Execute(C.ClipType.ctUnion,out,C.PolyFillType.pftNonZero,C.PolyFillType.pftNonZero);return C.Clipper.CleanPolygons(out,12);}
const move=(paths,x,y,angle=0,scale=1)=>{const c=Math.cos(angle),s=Math.sin(angle);return paths.map(r=>r.map(p=>V(Math.round((p.X*c-p.Y*s)*scale+x*S),Math.round((p.X*s+p.Y*c)*scale+y*S))));};
function petal(length,width){return [...bezier(V(0,0),V(length*.35,-width),V(length*.9,-width*.65),V(length,0),12),...bezier(V(length,0),V(length*.9,width*.65),V(length*.35,width),V(0,0),12).slice(1)];}
function rosette(r=16){let paths=[...stroke(circle(3.3),.75,true),...stroke(circle(r*.65),.65,true)];for(let i=0;i<12;i++){const a=i*Math.PI/6;paths.push(...move(stroke(petal(r-2,3.4),.65,true),...Object.values(polar(3,a)),a));}for(let i=0;i<24;i++){let a=i*Math.PI/12;paths.push(...move(stroke(circle(1.0,12),.55,true),...Object.values(polar(r+1.8,a))));}return normalize(paths);}
function curl(){let p=[...bezier(V(0,0),V(16,-16),V(31,-10),V(29,2)),...bezier(V(29,2),V(25,18),V(8,11),V(15,2)).slice(1),...bezier(V(15,2),V(19,-3),V(25,1),V(20,5)).slice(1)];let out=stroke(p,.9);for(let i=0;i<5;i++){let t=.15+i*.14;const v=p[Math.floor(t*(p.length-1))];out.push(...move(stroke(petal(7,2.1),.65,true),v.X,v.Y,-1.4+i*.35));}return normalize(out);}
function paisley(){const p=[...bezier(V(0,-18),V(17,-7),V(17,16),V(1,18)),...bezier(V(1,18),V(-17,18),V(-17,-6),V(-3,-6)).slice(1),...bezier(V(-3,-6),V(5,-5),V(5,-13),V(0,-18)).slice(1)];let out=stroke(p,.85,true);out.push(...move(stroke(p,.6,true),0,2,0,.7));for(let i=0;i<8;i++){const a=i*Math.PI/4;out.push(...move(stroke(petal(7,1.8),.55,true),0,7,a));}return normalize(out);}
function viennaTile(){let p=rosette(15);for(let i=0;i<4;i++){const a=i*Math.PI/2;p.push(...move(curl(),19*Math.cos(a),19*Math.sin(a),a+Math.PI/4,.64));p.push(...move(paisley(),35*Math.cos(a+.78),35*Math.sin(a+.78),a+2.25,.82));}return normalize(p);}
function rose(){let p=[];for(let ring=0;ring<4;ring++){const n=ring+3,r=3+ring*3.3;for(let j=0;j<n;j++){const a=j*Math.PI*2/n+ring*.8,pts=bezier(polar(r*.6,a-.55),polar(r+2,a-.8),polar(r+3,a+.6),polar(r*.68,a+.95),24);p.push(...stroke(pts,.85));}}p.push(...stroke(circle(1.2,16),.75,true));return normalize(p);}
function roseTile(){let p=rose();for(let i=0;i<4;i++){const a=i*Math.PI/2;const stem=bezier(V(11,6),V(25,12),V(13,35),V(35,37));let branch=stroke(stem,.85);for(let j=0;j<4;j++){const pt=stem[3+j*4];branch.push(...move(stroke(petal(11,4),.75,true),pt.X,pt.Y,(j%2?2.2:-.55)));const mid=bezier(V(0,0),V(3,0),V(8,0),V(10,0),5);branch.push(...move(stroke(mid,.55),pt.X,pt.Y,(j%2?2.2:-.55)));}p.push(...move(branch,0,0,a));p.push(...move(rose(),32*Math.cos(a+.3),32*Math.sin(a+.3),a,.45));}return normalize(p);}
function feather(){let p=[];const stem=bezier(V(0,36),V(-7,10),V(0,-15),V(2,-31),32);p.push(...stroke(stem,1));const eye=[...bezier(V(1,-32),V(21,-19),V(14,2),V(0,4)),...bezier(V(0,4),V(-17,0),V(-20,-20),V(1,-32)).slice(1)];p.push(...stroke(eye,.8,true),...move(stroke(eye,.65,true),0,-5,0,.65),...move(stroke(circle(3.5,24),.7,true),0,-13));for(let k=0;k<11;k++){const y=3+k*2.7,reach=11+(10-k)*.9;for(const side of [-1,1])p.push(...stroke(bezier(V(-2,y+3),V(side*reach*.6,y-6),V(side*reach,y-10),V(side*(reach+2),y-19),16),.6));}return normalize(p);}
// Every motif is a printable CAD outline. Repeated master tiles keep downloads compact.
function filled(points){const out=points.map(v=>V(Math.round(v.X*S),Math.round(v.Y*S)));if(C.Clipper.Area(out)<0)out.reverse();return [out];}
function daisy(){let p=stroke(circle(2.6),.9,true);for(let i=0;i<8;i++)p.push(...move(stroke(petal(8,2.6),.9,true),...Object.values(polar(2.5,i*Math.PI/4)),i*Math.PI/4));return normalize(p);}
function branch(solid=true){let p=stroke(bezier(V(-3,19),V(3,7),V(-3,-8),V(2,-19)),1);for(let i=0;i<5;i++)for(const side of [-1,1]){const leaf=petal(8,2.5);p.push(...move(solid?filled(leaf):stroke(leaf,.85,true),0,14-i*6,side===1?-1:-2.15));}return normalize(p);}
function heart(){const p=[...bezier(V(0,10),V(-24,-3),V(-12,-20),V(0,-8)),...bezier(V(0,-8),V(12,-20),V(24,-3),V(0,10)).slice(1)];return stroke(p,1.05,true);}
function star(){let p=[];for(let i=0;i<10;i++)p.push(polar(i%2?4.2:11,i*Math.PI/5-Math.PI/2));return stroke(p,1,true);}
function lily(){let p=stroke(bezier(V(0,18),V(2,4),V(0,-7),V(0,-14)),1);for(const a of [-2.25,-1.57,-.9])p.push(...move(stroke(petal(16,4),1,true),0,1,a));p.push(...move(filled(petal(12,3)),0,11,-.45),...move(filled(petal(9,2.5)),0,13,-2.6));return normalize(p);}
function fan(){let p=[];const outline=[V(0,15),...Array.from({length:45},(_,i)=>{const a=-Math.PI*.9+i/44*Math.PI*.8;return V(24*Math.cos(a),15+24*Math.sin(a));}),V(0,15)];p.push(...stroke(outline,1,true));for(let i=0;i<=12;i++){const a=-Math.PI*.9+i/12*Math.PI*.8;p.push(...stroke([V(0,15),V(24*Math.cos(a),15+24*Math.sin(a))],.7));}p.push(...move(rosette(6),0,10,0,.6));return normalize(p);}
function damask(){let p=move(lily(),0,2,0,1.15);for(const a of [0,Math.PI]){p.push(...move(curl(),3,-2,a,.8),...move(paisley(),-13,8,a,.6));}return normalize(p);}
function arabesque(){let p=[];for(let i=0;i<4;i++){const a=i*Math.PI/2;p.push(...move(curl(),0,0,a,.85),...move(stroke(petal(18,3.5),.85,true),0,0,a+Math.PI/4));}return normalize(p);}
function bouquet(){let p=[];for(let i=0;i<6;i++)p.push(...move(daisy(),...Object.values(polar(10,i*Math.PI/3)),i,.6));p.push(...move(daisy(),0,0,0,.6));for(let i=0;i<4;i++)p.push(...move(branch(false),...Object.values(polar(25,i*Math.PI/2)),i*Math.PI/2,.45));return normalize(p);}
function diamonds(){return normalize([...stroke([V(0,-12),V(8,0),V(0,12),V(-8,0)],.8,true),...filled(circle(1.5,16))]);}
function pearls(){let p=stroke(circle(10),.85,true);for(let i=0;i<12;i++)p.push(...move(filled(circle(.8,12)),...Object.values(polar(13,i*Math.PI/6))));return normalize(p);}
function petals(){let p=[];for(let i=0;i<4;i++)p.push(...move(stroke(petal(12,4),.9,true),0,0,i*Math.PI/2));return normalize(p);}
function waveRibbon(){let p=[];for(let y of [-5,5])p.push(...stroke(Array.from({length:65},(_,i)=>V(-18+i*36/64,y+3*Math.sin(i/64*Math.PI*2))),.9));return normalize(p);}
const definitions=[
{id:'daisy-air',name:'Ромашковое поле',group:'simple',tile:daisy,step:42,description:'Небольшие цветы и открытая ткань'},
{id:'olive-air',name:'Оливковая ветвь',group:'simple',tile:()=>branch(true),step:48,description:'Гладкие листья на тонких стеблях'},
{id:'fern-air',name:'Лёгкий папоротник',group:'simple',tile:()=>branch(false),step:46,description:'Прозрачные веточки без фоновой сетки'},
{id:'hearts-air',name:'Нежные сердца',group:'simple',tile:heart,step:43,description:'Крупные контурные сердца'},
{id:'stars-air',name:'Звёздный вечер',group:'simple',tile:star,step:35,description:'Звёзды на свободном поле'},
{id:'diamonds-air',name:'Тихие ромбы',group:'simple',tile:diamonds,step:32,description:'Лаконичная геометрия с жемчужиной'},
{id:'pearls-air',name:'Жемчужные кольца',group:'simple',tile:pearls,step:39,description:'Круги с небольшими бусинами'},
{id:'petals-air',name:'Четыре лепестка',group:'simple',tile:petals,step:37,description:'Простой цветочный ритм'},
{id:'lily-air',name:'Белые лилии',group:'simple',tile:lily,step:47,description:'Отдельные лилии с крупными просветами'},
{id:'ribbons-air',name:'Шёлковые ленты',group:'simple',tile:waveRibbon,step:42,description:'Плавные линии без мелкого декора'},
{id:'vienna',name:'Венское кружево',group:'dense',tile:viennaTile,step:83,net:7,description:'Розетки, пейсли и ажурные связи'},
{id:'rose-garden',name:'Садовые розы',group:'dense',tile:roseTile,step:78,net:8,description:'Розы в переплетении листьев'},
{id:'peacock',name:'Павлинье перо',group:'dense',tile:feather,step:52,net:7,description:'Выразительные перья на косой сетке'},
{id:'damask',name:'Королевский дамаск',group:'dense',tile:damask,step:51,net:7,description:'Лилии, завитки и симметрия'},
{id:'paisley',name:'Восточный пейсли',group:'dense',tile:()=>{let p=[];for(let i=0;i<4;i++)p.push(...move(paisley(),...Object.values(polar(16,i*Math.PI/2)),i*Math.PI/2,.85));return normalize(p);},step:58,net:7,description:'Переплетённые капли с цветочной серединой'},
{id:'fern-lace',name:'Лесное кружево',group:'dense',tile:()=>{let p=[];for(let i=0;i<4;i++)p.push(...move(branch(false),...Object.values(polar(14,i*Math.PI/2)),i*Math.PI/2,.85));return normalize(p);},step:48,net:6,description:'Венки из ажурных веточек'},
{id:'medallion',name:'Кружевной медальон',group:'dense',tile:()=>rosette(20),step:48,net:6,description:'Большие круглые розетки'},
{id:'arabesque',name:'Золотая арабеска',group:'dense',tile:arabesque,step:51,net:6,description:'Четыре переплетённых растительных завитка'},
{id:'hydrangea',name:'Цветочный букет',group:'dense',tile:bouquet,step:56,net:7,description:'Группы мелких цветов и листьев'},
{id:'fans',name:'Веера ар-деко',group:'dense',tile:fan,step:39,net:6,description:'Радиальные веера с цветочным основанием'}
];
function crop(paths,step){const c=new C.Clipper(),out=[];c.AddPaths(paths,C.PolyType.ptSubject,true);c.AddPath([V(-step*S/2,-step*S/2),V(step*S/2,-step*S/2),V(step*S/2,step*S/2),V(-step*S/2,step*S/2)],C.PolyType.ptClip,true);c.Execute(C.ClipType.ctIntersection,out,C.PolyFillType.pftNonZero,C.PolyFillType.pftNonZero);return out;}
const pathString=paths=>paths.map(r=>r.map((v,i)=>(i?'L':'M')+v.X+','+v.Y).join('')+'Z').join('');
const assets=[];fs.mkdirSync('public/designs',{recursive:true});
for(const d of definitions){let tile=d.tile();if(d.group==='dense'){const co=new C.ClipperOffset(2,40),thick=[];co.AddPaths(tile,C.JoinType.jtRound,C.EndType.etClosedPolygon);co.Execute(thick,120);tile=thick;}
let repeats=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)repeats.push(...move(tile,x*d.step,y*d.step));let motifs=crop(normalize(repeats),d.step),master=motifs;
if(d.net){const grid=[];const n=Math.round(d.step/d.net),spacing=d.step/n;for(let b=-d.step*2;b<=d.step*2+.01;b+=spacing)for(const slope of [-1,1])grid.push(...stroke([V(-d.step,slope*-d.step+b),V(d.step,slope*d.step+b)],.75));const co=new C.ClipperOffset(2,40),mask=[];co.AddPaths(motifs,C.JoinType.jtRound,C.EndType.etClosedPolygon);co.Execute(mask,650);const c=new C.Clipper(),cut=[];c.AddPaths(grid,C.PolyType.ptSubject,true);c.AddPaths(mask,C.PolyType.ptClip,true);c.Execute(C.ClipType.ctDifference,cut,C.PolyFillType.pftNonZero,C.PolyFillType.pftNonZero);master=crop(normalize([...motifs,...cut]),d.step);}
const coverage=Math.round(Math.abs(master.reduce((sum,r)=>sum+C.Clipper.Area(r),0))/(d.step*d.step*S*S)*100);
const paths=master.map(r=>r.map(v=>V(v.X/S,v.Y/S)));assets.push({id:d.id,name:d.name,category:d.group==='simple'?'Простые':'Плотные',group:d.group,description:d.description,tags:[d.group,'готовое полотно'],repeatStep:d.step,coverage,viewBox:[-200,-200,400,400],paths,preview:'/designs/'+d.id+'.svg',license:'CC0-1.0; original procedural CAD lace',revision:2,minFeature:.65});
// A periodic preview shows the actual motif scale and open-fabric ratio.
const path=pathString(paths);fs.writeFileSync('public/designs/'+d.id+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-75 -75 150 150"><defs><pattern id="lace" x="${-d.step/2}" y="${-d.step/2}" width="${d.step}" height="${d.step}" patternUnits="userSpaceOnUse" viewBox="${-d.step/2} ${-d.step/2} ${d.step} ${d.step}"><path fill="#fff7e8" fill-rule="nonzero" d="${path}"/></pattern></defs><rect x="-75" y="-75" width="150" height="150" fill="#544d50"/><rect x="-75" y="-75" width="150" height="150" fill="url(#lace)"/></svg>`);console.log(d.group,d.id,coverage+'%',paths.reduce((n,r)=>n+r.length,0),'vertices/tile');}
fs.writeFileSync('src/library/designs.json',JSON.stringify(assets));
