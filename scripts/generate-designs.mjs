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
function rosette(r=16){let paths=[...stroke(circle(3.3),.75,true),...stroke(circle(r*.65),.65,true)];for(let i=0;i<12;i++){const a=i*Math.PI/6;paths.push(...move(stroke(petal(r-2,3.4),.65,true),...Object.values(polar(3,a)),a));}return normalize(paths);}
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
// Botanical building blocks. Dense sheets are made by overlapping these motifs;
// they deliberately have no background lattice or filler grid.
function roseBloom(r=13){const ring=(radius,lobes,depth,phase=0)=>stroke(Array.from({length:96},(_,i)=>{const a=i*Math.PI*2/96;return polar(radius+depth*Math.sin(lobes*a+phase),a);}),.9,true);const spiral=[];for(let i=0;i<72;i++){const a=i*Math.PI*2*1.65/71,rr=.7+i/71*r*.31;spiral.push(polar(rr,a));}return normalize([...ring(r*.92,5,r*.16,.2),...ring(r*.62,4,r*.12,.8),...ring(r*.34,3,r*.08,1.4),...stroke(spiral,.85)]);}
function leaf(l=13,w=3.8){return stroke(petal(l,w),.85,true);}
function leafySprig(scale=1){let p=stroke(bezier(V(-2,24),V(2,9),V(-4,-6),V(1,-25)),1.05);for(let i=0;i<7;i++){const t=.12+i*.12,stem=bezier(V(-2,24),V(2,9),V(-4,-6),V(1,-25),40),at=stem[Math.round(t*40)];for(const side of[-1,1])p.push(...move(leaf(9,2.7),at.X,at.Y,side>0?-.55:-2.55,.78));}return normalize(p.map(r=>r.map(v=>V(v.X*scale,v.Y*scale))));}
function blossomBranch(){let p=leafySprig(.9);for(const [x,y,a,s] of [[0,10,.1,.48],[3,-4,1.1,.42],[-1,-16,-.5,.38]])p.push(...move(roseBloom(11),x,y,a,s));return normalize(p);}
function scrollStem(){let p=[];const a=[...bezier(V(-25,7),V(-10,-18),V(16,-18),V(18,-2)),...bezier(V(18,-2),V(20,12),V(4,13),V(5,3)).slice(1)];p.push(...stroke(a,1.1));for(let i=0;i<5;i++){const q=a[Math.floor((i+2)*a.length/7)];p.push(...move(leaf(10,3),q.X,q.Y,i%2?-.4:-2.65,.8));}p.push(...move(roseBloom(12),-23,7,-.6,.62),...move(roseBloom(9),17,-1,1.5,.48));return normalize(p);}
function orchid(){let p=stroke(bezier(V(0,21),V(-2,3),V(3,-8),V(0,-19)),1);for(const a of[-2.6,-1.7,-.8,.1,.8])p.push(...move(stroke(petal(17,4.4),.9,true),0,1,a));p.push(...filled(circle(2.7,20)));return normalize(p);}
function treeBranch(){let p=stroke(bezier(V(-22,26),V(-7,10),V(8,-5),V(23,-25)),1.25);for(let i=0;i<8;i++){const t=.08+i*.11,x=-22+45*t,y=26-51*t+5*Math.sin(t*4);p.push(...move(leaf(10,3.1),x,y,i%2?-.5:-2.6,.86));if(i===2||i===5)p.push(...move(roseBloom(9),x,y,i,.38));}return normalize(p);}
function botanicalMedallion(){let p=rosette(18);for(let i=0;i<4;i++){const a=i*Math.PI/2;p.push(...move(scrollStem(),24*Math.cos(a),24*Math.sin(a),a,.63));}return normalize(p);}
function gardenCluster(){let p=[...move(roseBloom(17),0,0,0,.92),...move(roseBloom(12),-18,13,-.8,.68),...move(roseBloom(10),18,14,.9,.58),...move(leafySprig(),-27,10,-.55,.72),...move(leafySprig(),27,12,.55,.72)];return normalize(p);}
const definitions=[
{id:'daisy-air',name:'Ромашковый луг',group:'simple',tile:daisy,step:46,description:'Отдельные ромашки на открытом тюле'},
{id:'rose-air',name:'Рассыпанные розы',group:'simple',tile:()=>move(roseBloom(14),0,0,0,.62),step:49,description:'Небольшие розы с видимыми лепестками'},
{id:'olive-air',name:'Оливковая ветвь',group:'simple',tile:()=>branch(true),step:52,description:'Гладкие листья на тонком стебле'},
{id:'fern-air',name:'Лёгкий папоротник',group:'simple',tile:()=>leafySprig(.72),step:55,description:'Ажурные веточки с большими просветами'},
{id:'lily-air',name:'Белые лилии',group:'simple',tile:lily,step:55,description:'Отдельные лилии с крупными лепестками'},
{id:'orchid-air',name:'Орхидеи',group:'simple',tile:()=>move(orchid(),0,0,0,.62),step:58,description:'Редкие орхидеи на свободном поле'},
{id:'blossom-air',name:'Цветущая ветка',group:'simple',tile:()=>move(blossomBranch(),0,0,0,.62),step:61,description:'Бутоны и листья на тонкой ветке'},
{id:'willow-air',name:'Ивовая ветвь',group:'simple',tile:()=>move(treeBranch(),0,0,0,.58),step:63,description:'Листья и небольшие цветы на дуге'},
{id:'petals-air',name:'Четыре лепестка',group:'simple',tile:petals,step:45,description:'Минималистичный цветочный ритм'},
{id:'ribbons-air',name:'Шёлковые ленты',group:'simple',tile:waveRibbon,step:50,description:'Плавные линии как лёгкие стебли'},
{id:'vienna',name:'Венский сад',group:'dense',tile:botanicalMedallion,step:54,description:'Розетки, листья и завитки без фоновой сетки'},
{id:'rose-garden',name:'Розарий',group:'dense',tile:gardenCluster,step:60,description:'Перекрывающиеся розы, листья и стебли'},
{id:'peacock',name:'Лесные ветви',group:'dense',tile:()=>normalize([...move(treeBranch(),-18,0,-.22,1),...move(treeBranch(),18,0,.22,1),...move(roseBloom(13),0,1,0,.72)]),step:58,description:'Густые ветви с цветущими акцентами'},
{id:'damask',name:'Королевские лилии',group:'dense',tile:()=>normalize([...move(lily(),0,0,0,1.2),...move(scrollStem(),-20,7,-.2,.88),...move(scrollStem(),20,7,Math.PI+.2,.88)]),step:54,description:'Лилии, листья и текучие завитки'},
{id:'paisley',name:'Пейсли в цветах',group:'dense',tile:()=>normalize([...move(paisley(),-14,0,-.3,1.05),...move(paisley(),14,0,Math.PI+.3,1.05),...move(roseBloom(13),0,0,0,.74),...move(leafySprig(),0,8,0,.78)]),step:56,description:'Капли пейсли с розой и листвой'},
{id:'fern-lace',name:'Лесная гирлянда',group:'dense',tile:()=>normalize([...move(leafySprig(),-15,0,-.55,1),...move(leafySprig(),15,0,.55,1),...move(blossomBranch(),0,0,0,.88)]),step:52,description:'Плотное переплетение ветвей, листьев и бутонов'},
{id:'medallion',name:'Цветочный медальон',group:'dense',tile:()=>normalize([...move(roseBloom(18),0,0,0,1),...move(leaf(16,4),0,-22,-1.57),...move(leaf(16,4),0,22,1.57),...move(leaf(16,4),-22,0,Math.PI),...move(leaf(16,4),22,0,0)]),step:50,description:'Крупная роза в лиственном венке'},
{id:'arabesque',name:'Садовая арабеска',group:'dense',tile:()=>normalize([...move(scrollStem(),0,0,0,1.05),...move(scrollStem(),0,0,Math.PI,1.05),...move(roseBloom(11),0,0,0,.62)]),step:50,description:'Непрерывные завитки с листьями и розами'},
{id:'hydrangea',name:'Букет на тюле',group:'dense',tile:()=>normalize([...move(gardenCluster(),0,0,0,1),...move(blossomBranch(),-22,9,-.75,.78),...move(blossomBranch(),22,9,.75,.78)]),step:62,description:'Розы, бутоны и листва в цельном букете'},
{id:'fans',name:'Орхидейный виток',group:'dense',tile:()=>normalize([...move(orchid(),-13,0,-.35,.9),...move(orchid(),13,0,.35,.9),...move(scrollStem(),0,0,0,.95),...move(scrollStem(),0,0,Math.PI,.95)]),step:54,description:'Орхидеи, листья и симметричные завихрения'}
];
function crop(paths,step){const c=new C.Clipper(),out=[];c.AddPaths(paths,C.PolyType.ptSubject,true);c.AddPath([V(-step*S/2,-step*S/2),V(step*S/2,-step*S/2),V(step*S/2,step*S/2),V(-step*S/2,step*S/2)],C.PolyType.ptClip,true);c.Execute(C.ClipType.ctIntersection,out,C.PolyFillType.pftNonZero,C.PolyFillType.pftNonZero);return out;}
const pathString=paths=>paths.map(r=>r.map((v,i)=>(i?'L':'M')+v.X+','+v.Y).join('')+'Z').join('');
const assets=[];fs.mkdirSync('public/designs',{recursive:true});
for(const d of definitions){let tile=d.tile();if(d.group==='dense'){const co=new C.ClipperOffset(2,40),thick=[];co.AddPaths(tile,C.JoinType.jtRound,C.EndType.etClosedPolygon);co.Execute(thick,280);tile=thick;}
let repeats=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)repeats.push(...move(tile,x*d.step,y*d.step));let motifs=crop(normalize(repeats),d.step),master=motifs;
const coverage=Math.round(Math.abs(master.reduce((sum,r)=>sum+C.Clipper.Area(r),0))/(d.step*d.step*S*S)*100);
const paths=master.map(r=>r.map(v=>V(v.X/S,v.Y/S)));assets.push({id:d.id,name:d.name,category:d.group==='simple'?'Простые':'Плотные',group:d.group,description:d.description,tags:[d.group,'ботаника','без сетки'],repeatStep:d.step,coverage,construction:'motifs',viewBox:[-200,-200,400,400],paths,preview:'/designs/'+d.id+'.svg',license:'CC0-1.0; original procedural CAD lace',revision:3,minFeature:.65});
// A periodic preview shows the actual motif scale and open-fabric ratio.
const path=pathString(paths);fs.writeFileSync('public/designs/'+d.id+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-75 -75 150 150"><defs><pattern id="lace" x="${-d.step/2}" y="${-d.step/2}" width="${d.step}" height="${d.step}" patternUnits="userSpaceOnUse" viewBox="${-d.step/2} ${-d.step/2} ${d.step} ${d.step}"><path fill="#fff7e8" fill-rule="nonzero" d="${path}"/></pattern></defs><rect x="-75" y="-75" width="150" height="150" fill="#544d50"/><rect x="-75" y="-75" width="150" height="150" fill="url(#lace)"/></svg>`);console.log(d.group,d.id,coverage+'%',paths.reduce((n,r)=>n+r.length,0),'vertices/tile');}
fs.writeFileSync('src/library/designs.json',JSON.stringify(assets));
