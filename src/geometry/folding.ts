import {Matrix4,Vector3} from 'three';
import type {Panel} from './envelope';
const stages={base:[0,1],left:[0,.38],right:[.08,.46],bottom:[.3,.72],top:[.6,1]} as const;
export function panelFoldProgress(panel:Panel,progress:number){if(panel.id==='base')return 0;const [start,end]=stages[panel.id];return Math.max(0,Math.min(1,(progress-start)/(end-start)));}
// Schematic hinges in the same mm coordinate system as the manufacturing model.
// This pose is preview-only; exporters always use flat manufacturing geometry.
export function foldingMatrix(panel:Panel,progress:number,thickness:number){if(!panel.hinge)return new Matrix4();const t=panelFoldProgress(panel,progress),[a,b]=panel.hinge,pivot=new Vector3(a.X,-a.Y,0),axis=new Vector3(b.X-a.X,a.Y-b.Y,0).normalize();const order={base:0,left:1,right:2,bottom:3,top:4}[panel.id];return new Matrix4().makeTranslation(pivot.x,pivot.y,order*thickness*t).multiply(new Matrix4().makeRotationAxis(axis,Math.PI*t)).multiply(new Matrix4().makeTranslation(-pivot.x,-pivot.y,0));}
