'use client';
import {Check} from 'lucide-react';
import {assets} from '../library';
import {preset,type DesignId} from '../geometry/presets';
import {useEditor} from '../state/editor';
export function Library(){const s=useEditor(),current=s.project.ornaments[0]?.assetId;return <><p className="eyebrow">ГОТОВЫЕ КОМПОЗИЦИИ</p><h2>Одно полотно.<br/><em>Весь конверт.</em></h2><p className="catalog-intro">Выберите рисунок. Он сразу заполнит основание и все четыре клапана.</p><div className="design-catalog">{assets.map(a=><button key={a.id} className={'design-card '+(current===a.id?'selected':'')} onClick={()=>{s.replace(preset(a.id as DesignId,s.project));}}><img src={a.preview} alt={a.name} loading="lazy"/><span className="design-caption"><b>{a.name}</b>{current===a.id&&<Check size={17}/>}<small>{a.description}</small></span></button>)}</div><p className="note">Готовая векторная композиция. Все детали уже соединены в рисунок — собирать их вручную не нужно.</p></>;}
