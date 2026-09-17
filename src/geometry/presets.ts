import {defaultProject,type Project} from '../domain/project';
import {instance} from './transforms';
import {envelopeGeometry} from './envelope';
import {assetById} from '../library';
export type DesignId=string;
export function preset(kind:DesignId,source:Project=defaultProject):Project{const p=structuredClone(source),g=envelopeGeometry(p.envelope),asset=assetById(kind);p.name=asset.name;p.ornaments=[instance(kind,g.center.X,g.center.Y)];return p;}
