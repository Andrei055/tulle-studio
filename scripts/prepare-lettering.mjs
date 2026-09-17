import fs from 'node:fs';
import opentype from 'opentype.js';
import C from 'clipper-lib';
const font=opentype.parse(fs.readFileSync('public/fonts/GreatVibes-Regular.ttf').buffer);
const chars=[...new Set([...Array.from({length:224},(_,i)=>String.fromCodePoint(32+i)),...Array.from({length:304},(_,i)=>String.fromCodePoint(0x400+i)),...'–—«»„“”‘’…♥'])];
const glyphs={},kerning={};
for(const char of chars){if(!font.charToGlyphIndex(char))continue;const glyph=font.charToGlyph(char),rings=[];let ring=[],current={x:0,y:0};for(const cmd of glyph.getPath(0,0,100).commands){if(cmd.type==='M'){ring=[];rings.push(ring);current={x:cmd.x,y:cmd.y};ring.push(current);}else if(cmd.type==='L'){current={x:cmd.x,y:cmd.y};ring.push(current);}else if(cmd.type==='Q'||cmd.type==='C'){const a=current;for(let i=1;i<=24;i++){const t=i/24,u=1-t;ring.push(cmd.type==='Q'?{x:u*u*a.x+2*u*t*cmd.x1+t*t*cmd.x,y:u*u*a.y+2*u*t*cmd.y1+t*t*cmd.y}:{x:u*u*u*a.x+3*u*u*t*cmd.x1+3*u*t*t*cmd.x2+t*t*t*cmd.x,y:u*u*u*a.y+3*u*u*t*cmd.y1+3*u*t*t*cmd.y2+t*t*t*cmd.y});}current={x:cmd.x,y:cmd.y};}}
const clip=new C.Clipper(),out=[];clip.AddPaths(rings.filter(r=>r.length>2).map(r=>r.map(p=>({X:Math.round(p.x*1000),Y:Math.round(p.y*1000)}))),C.PolyType.ptSubject,true);clip.Execute(C.ClipType.ctUnion,out,C.PolyFillType.pftNonZero,C.PolyFillType.pftNonZero);glyphs[char]={advance:Math.round(glyph.advanceWidth/font.unitsPerEm*100000)/1000,paths:C.Clipper.CleanPolygons(out,8).map(r=>r.map(p=>({X:p.X/1000,Y:p.Y/1000})))};}
for(const a of chars)for(const b of chars){const k=font.getKerningValue(font.charToGlyph(a),font.charToGlyph(b));if(k)kerning[a+b]=Math.round(k/font.unitsPerEm*100000)/1000;}
fs.writeFileSync('src/library/lettering-font.json',JSON.stringify({name:'Great Vibes',units:100,glyphs,kerning}));console.log(Object.keys(glyphs).length,'characters; Cyrillic:',!!glyphs['С']);
