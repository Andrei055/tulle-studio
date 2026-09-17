import {writeFileSync} from 'node:fs';
import {preset} from '../src/geometry/presets';
import {buildGeometry} from '../src/geometry/envelope';
import {pathData,centroid} from '../src/geometry/polygons';
const g=buildGeometry(preset('vienna'));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${g.width+16} ${g.total+16}"><rect x="-10" y="-10" width="${g.width+20}" height="${g.total+20}" fill="#e9e7e1"/><path d="${pathData(g.outer)}" fill="#625b60"/><path d="${pathData(g.top)}" fill="#fff8eb"/>${g.panels.map(p=>{const c=centroid(p.outer);return `<circle cx="${c.x}" cy="${c.y}" r="3.4" fill="#fff8eb" stroke="#9b657e" stroke-width=".3"/><text x="${c.x}" y="${c.y+1}" font-size="3" font-family="Arial" text-anchor="middle" fill="#754a5b">${({base:1,left:2,right:3,bottom:4,top:5})[p.id]}</text>`;}).join('')}</svg>`;
writeFileSync('/tmp/tulle-five-panel-proof.svg',svg);console.log('unfolded bounds',g.width,g.total,'PLA rings',g.top.length);
