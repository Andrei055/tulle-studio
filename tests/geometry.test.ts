import {describe,it,expect,beforeAll} from 'vitest';
import {Vector3} from 'three';
import {defaultProject,parseProject} from '../src/domain/project';
import {envelopeGeometry,buildGeometry} from '../src/geometry/envelope';
import {bounds,area,boolean,centroid,rect} from '../src/geometry/polygons';
import {instance,transform,mirrored,centered,snapPoint} from '../src/geometry/transforms';
import {preset} from '../src/geometry/presets';
import {foldingMatrix} from '../src/geometry/folding';
import {extrude,meshAudit,heights} from '../src/manufacturing/model';
import {projectFromJSON,svgFile,stlFile} from '../src/export/files';
import {assets} from '../src/library';
import {initializeKernel,manufacturingPaths} from '../src/manufacturing/kernel';
beforeAll(async()=>{await initializeKernel();});
const base=()=>structuredClone(defaultProject);
describe('Five-part envelope',()=>{
 it('has precisely one base, four attached flaps and four hinges',()=>{const g=envelopeGeometry(base().envelope);expect(g.panels.map(p=>p.id).sort()).toEqual(['base','bottom','left','right','top']);expect(g.panels.filter(p=>p.hinge)).toHaveLength(4);expect(area(g.base)).toBeCloseTo(180*85,1);});
 it('matches requested base size and unfolded bounds at 0 degrees',()=>{const e={...base().envelope,layoutRotation:0};const g=envelopeGeometry(e),b=bounds(g.base);expect(b.width).toBeCloseTo(e.width,3);expect(b.height).toBeCloseTo(e.height,3);expect(g.width).toBeCloseTo(e.width+2*e.sideFlapDepth,3);expect(g.total).toBeCloseTo(e.flapHeight+e.height+e.bottomFlapDepth,3);});
 it('has no overlapping panel interiors',()=>{const g=envelopeGeometry(base().envelope);for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)expect(area(boolean(g.panels[i].outer,g.panels[j].outer,'intersection'))).toBeLessThan(.02);});
 it('folds all four flaps into the base',()=>{const p=base(),g=envelopeGeometry(p.envelope);for(const panel of g.panels.filter(p=>p.hinge)){const matrix=foldingMatrix(panel,1,.9);const folded=panel.outer.map(r=>r.map(v=>{const q=new Vector3(v.X,-v.Y,0).applyMatrix4(matrix);return {X:q.x,Y:-q.y};}).reverse());expect(area(boolean(folded,g.base,'difference'))).toBeLessThan(.05);}});
 it('raises a flap above the base during folding',()=>{const g=envelopeGeometry(base().envelope),left=g.panels.find(p=>p.id==='left')!;const m=foldingMatrix(left,.19,.9);expect(Math.max(...left.outer[0].map(v=>new Vector3(v.X,-v.Y,0).applyMatrix4(m).z))).toBeGreaterThan(30);});
 it('protects every hinge across frame and drawing',()=>{const p=preset('peacock'),g=buildGeometry(p);for(const layer of [g.bottom,g.top])expect(area(boolean(layer,g.keepOut,'intersection'))).toBeLessThan(.005);expect(area(boolean(g.items[0].paths,g.allowed,'difference'))).toBeLessThan(.005);});
 it('has specified border width on a straight base',()=>{const e={...base().envelope,layoutRotation:0,contour:'straight' as const};const g=envelopeGeometry(e),b=bounds(g.panels[0].solid);const sample=rect(b.x+8,b.y,10,e.borderWidth);expect(area(boolean(g.border,sample,'intersection'))).toBeCloseTo(10*e.borderWidth,2);});
 it.each(['triangle','round','straight'] as const)('builds separate solid frames for %s flaps',flapShape=>{const p=base();p.envelope.flapShape=flapShape;const g=buildGeometry(p);const mesh=extrude(g.bottom,.4),audit=meshAudit(mesh);expect(audit.badEdges).toBe(0);expect(audit.degenerate).toBe(0);mesh.dispose();});
 it('rebuilds dimensions parametrically',()=>{const a=base(),b=base();b.envelope.width=220;expect(area(envelopeGeometry(b.envelope).base)-area(envelopeGeometry(a.envelope).base)).toBeCloseTo(40*85,1);});
});
describe('Ready-made whole drawings',()=>{
 it('exposes complete sheets instead of primitive shapes',()=>{expect(assets.map(a=>a.id)).toEqual(['vienna','rose-garden','peacock']);for(const a of assets){expect(a.paths.flat().length).toBeGreaterThan(5000);const p=preset(a.id as 'vienna');expect(p.ornaments).toHaveLength(1);}});
 it('moves the complete sheet as one editable object',()=>{const p=preset('peacock'),first=transform(p.ornaments[0])[0][0];p.ornaments[0].x+=13;p.ornaments[0].y-=7;const second=transform(p.ornaments[0])[0][0];expect(second.X-first.X).toBeCloseTo(13);expect(second.Y-first.Y).toBeCloseTo(-7);});
 it.each(['vienna','rose-garden','peacock'] as const)('exports a closed printable mesh: %s',kind=>{const p=preset(kind),g=buildGeometry(p);const mesh=extrude(g.top,.4);const a=meshAudit(mesh);expect(a.nonfinite).toBe(0);expect(a.degenerate).toBe(0);expect(a.badEdges).toBe(0);const expectedVolume=area(manufacturingPaths(g.top))*.4;expect(Math.abs(a.volume-expectedVolume)/expectedVolume).toBeLessThan(.0001);mesh.dispose();},30000);
 it('holds transformed drawings outside keep-out zones',()=>{const p=preset('peacock');Object.assign(p.ornaments[0],{scaleX:.75,scaleY:.75,rotation:27,flipX:true,x:70});const g=buildGeometry(p);expect(area(boolean(g.top,g.keepOut,'intersection'))).toBeLessThan(.005);const mesh=extrude(g.top,.4);expect(meshAudit(mesh)).toMatchObject({badEdges:0,degenerate:0,nonfinite:0});mesh.dispose();},30000);
 it.each(['x','y'] as const)('preserves exact reflection around %s',axis=>{const o={...instance('branch',32,61),rotation:31};const c={x:90,y:87},a=transform(o).flat(),b=transform(mirrored(o,axis,c)).flat();for(const v of a){const x=axis==='x'?2*c.x-v.X:v.X,y=axis==='y'?2*c.y-v.Y:v.Y;expect(b.some(q=>Math.hypot(q.X-x,q.Y-y)<1e-8)).toBe(true);}});
 it('centers mathematically and snaps to guides',()=>{const region=[[{X:0,Y:0},{X:100,Y:0},{X:0,Y:60}]],c=centroid(region),b=bounds(transform(centered(instance('leaf'),region,'both')));expect(b.cx).toBeCloseTo(c.x);expect(b.cy).toBeCloseTo(c.y);expect(snapPoint(10.3,15.7,1,[{x:10.5,y:15.5}],.4)).toMatchObject({x:10.5,y:15.5});});
});
describe('Manufacturing and persistence',()=>{
 it('round-trips v2 and clearly rejects the obsolete three-panel schema',()=>{const p=preset('peacock');expect(projectFromJSON(JSON.stringify(p))).toEqual(p);expect(()=>projectFromJSON(JSON.stringify({...p,version:1}))).toThrow('трёхсекционной');expect(()=>parseProject({...p,envelope:{...p.envelope,width:-1}})).toThrow();});
 it('uses full unfolded bounds for SVG and valid binary STL',async()=>{const p=preset('peacock'),g=buildGeometry(p);expect(await svgFile(p)).toContain(`width="${g.width}mm"`);const stl=await stlFile(p);expect(stl.byteLength).toBe(84+stl.getUint32(80,true)*50);},30000);
 it('retains separate PLA layers and Z settings',()=>{const p=preset('peacock');p.layers.border.visible=false;p.ornaments[0].top=false;const g=buildGeometry(p);expect(area(g.bottom)).toBeGreaterThan(0);expect(area(g.top)).toBe(0);expect(heights(p.print).resume).toBeCloseTo(.72);});
});
