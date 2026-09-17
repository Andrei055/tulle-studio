import math,json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
def poly(points):
 a=sum(p[0]*points[(i+1)%len(points)][1]-points[(i+1)%len(points)][0]*p[1] for i,p in enumerate(points))
 return [{'X':round(x,4),'Y':round(y,4)} for x,y in (points if a>0 else points[::-1])]
def ellipse(cx,cy,rx,ry,rot=0):
 return poly([(cx+rx*math.cos(t)*math.cos(rot)-ry*math.sin(t)*math.sin(rot),cy+rx*math.cos(t)*math.sin(rot)+ry*math.sin(t)*math.cos(rot)) for t in [i*math.tau/32 for i in range(32)]])
def leaf(cx,cy,rot,size=1):
 pts=[]
 for i in range(41):
  t=i*math.tau/40;x=8*math.cos(t)*size;y=3.2*math.sin(t)**3*size
  pts.append((cx+x*math.cos(rot)-y*math.sin(rot),cy+x*math.sin(rot)+y*math.cos(rot)))
 return poly(pts)
flower=[ellipse(math.cos(i*math.tau/8)*8,math.sin(i*math.tau/8)*8,6,3.8,i*math.tau/8) for i in range(8)]+[ellipse(0,0,4,4)]
branch=[poly([(-.65,-20),(.65,-20),(.65,20),(-.65,20)])]+[leaf(s*5,y,(-.55 if s>0 else .55),.85) for y in [-12,-3,6,15] for s in [-1,1]]
corner=[poly([(0,0),(27,0),(27,1.5),(1.5,1.5),(1.5,27),(0,27)])]+[leaf(6,6,.8),leaf(16,4,0),leaf(4,16,math.pi/2)]
border=[ellipse(i*7,0,4.5,3.3) for i in range(6)]
assets=[]
for id,name,cat,tags,paths in [('flower','Камелия','Цветы',['цветок','роза','свадьба'],flower),('leaf','Лист','Ботаника',['лист','природа'],[leaf(0,0,0)]),('branch','Ветвь','Ботаника',['ветка','листья'],branch),('diamond','Ромб','Геометрия',['минимализм'],[poly([(0,-9),(6,0),(0,9),(-6,0)])]),('corner','Уголок','Бордюры',['рамка','угол'],corner),('border','Бусины','Бордюры',['бордюр','кружево'],border)]:
 xs=[p['X'] for r in paths for p in r];ys=[p['Y'] for r in paths for p in r];box=[min(xs),min(ys),max(xs)-min(xs),max(ys)-min(ys)]
 a=dict(id=id,name=name,category=cat,tags=tags,paths=paths,preview='/ornaments/'+id+'.svg',license='CC0-1.0; original development geometry',revision=1,viewBox=box);assets.append(a)
 d=' '.join(' '.join(('M' if i==0 else 'L')+str(p['X'])+','+str(p['Y']) for i,p in enumerate(r))+'Z' for r in paths)
 (root/'public/ornaments'/f'{id}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box[0]-2} {box[1]-2} {box[2]+4} {box[3]+4}"><path fill="#573b48" d="{d}"/></svg>')
(root/'src/library/assets.json').write_text(json.dumps(assets,ensure_ascii=False))
