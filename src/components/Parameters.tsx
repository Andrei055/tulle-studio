"use client";
import { useEditor } from "../state/editor";
import { NumberField, Toggle } from "./Fields";
import type { Envelope, PrintProfile } from "../domain/project";
import { heights } from "../manufacturing/model";
export function Parameters(){const s=useEditor(),e=s.project.envelope;const set=<K extends keyof Envelope>(key:K,value:Envelope[K])=>s.commit(p=>{p.envelope[key]=value;});return <><p className="eyebrow">ОСНОВАНИЕ + 4 КЛАПАНА</p><h2>Настоящий<br/><em>конверт.</em></h2><p className="catalog-intro">Размер основания — это размер закрытого конверта. Четыре лепестка загибаются внутрь.</p><div className="field-grid"><NumberField label="Ширина основания" value={e.width} min={80} max={300} onChange={v=>set('width',v)}/><NumberField label="Высота основания" value={e.height} min={50} max={150} onChange={v=>set('height',v)}/></div><div className="section-label">Глубина клапанов</div><div className="field-grid"><NumberField label="Верхний" value={e.flapHeight} min={20} max={150} onChange={v=>set('flapHeight',v)}/><NumberField label="Нижний" value={e.bottomFlapDepth} min={20} max={150} onChange={v=>set('bottomFlapDepth',v)}/><NumberField label="Боковые" value={e.sideFlapDepth} min={15} max={150} onChange={v=>set('sideFlapDepth',v)}/><NumberField label="Разворот на столе" value={e.layoutRotation} min={0} max={90} unit="°" onChange={v=>set('layoutRotation',v)}/></div><label className="field"><span>Форма лепестков</span><select value={e.flapShape} onChange={ev=>set('flapShape',ev.target.value as Envelope['flapShape'])}><option value="triangle">Треугольная</option><option value="round">Округлая</option><option value="straight">Трапеция</option></select></label><label className="field"><span>Край конверта</span><select value={e.contour} onChange={ev=>set('contour',ev.target.value as Envelope['contour'])}><option value="wave">Волнистый</option><option value="straight">Прямой</option></select></label><div className="section-label">Обводка и волны</div><div className="field-grid"><NumberField label="Толщина контура" value={e.borderWidth} min={.8} max={8} onChange={v=>set('borderWidth',v)}/></div>{e.contour==='wave'&&<div className="field-grid"><NumberField label="Глубина волны" value={e.amplitude} min={0} max={6} step={.25} onChange={v=>set('amplitude',v)}/><NumberField label="Частота волн" value={e.waves} min={2} max={12} step={1} unit="" onChange={v=>set('waves',Math.round(v))}/></div>}<p className="note">Меньше частота — шире и спокойнее волны. Высота автоматически ограничена, чтобы край не становился острым.</p><details className="technical-details"><summary>Технологические зазоры</summary><div className="field-grid"><NumberField label="Зазор сгиба" value={e.foldWidth} min={1} max={12} onChange={v=>set('foldWidth',v)}/><NumberField label="Отступ рисунка" value={e.edgeClearance} min={0} max={10} onChange={v=>set('edgeClearance',v)}/><NumberField label="Зазор на кончике" value={e.closingWidth} min={0} max={12} onChange={v=>set('closingWidth',v)}/></div></details><div className="soft-callout">На четырёх линиях сгиба остаётся ткань. Рисунок и рамки не перекрывают эти гибкие участки.</div></>;}
export function PrintSettings() {
  const s = useEditor(),
    p = s.project.print,
    h = heights(p);
  const set = <K extends keyof PrintProfile>(k: K, v: PrintProfile[K]) =>
    s.commit((x) => {
      x.print[k] = v;
      if (k === "bottomLayerCount") x.print.pauseAfterLayer = Number(v);
    });
  return (
    <>
      <p className="eyebrow">ПРОИЗВОДСТВО</p>
      <h2>
        Слой за
        <br />
        <em>слоем.</em>
      </h2>
      <label className="field">
        <span>Принтер</span>
        <input
          value={p.printer}
          onChange={(ev) => set("printer", ev.target.value)}
        />
      </label>
      <div className="field-grid">
        <NumberField
          label="Сопло"
          value={p.nozzleDiameter}
          min={0.1}
          max={1.2}
          onChange={(v) => set("nozzleDiameter", v)}
        />
        <NumberField
          label="Первый слой"
          value={p.firstLayerHeight}
          min={0.05}
          max={0.6}
          onChange={(v) => set("firstLayerHeight", v)}
        />
        <NumberField
          label="Обычный слой"
          value={p.normalLayerHeight}
          min={0.05}
          max={0.6}
          onChange={(v) => set("normalLayerHeight", v)}
        />
        <NumberField
          label="Слоёв снизу"
          value={p.bottomLayerCount}
          min={1}
          max={20}
          step={1}
          unit=""
          onChange={(v) => set("bottomLayerCount", Math.round(v))}
        />
        <NumberField
          label="Слоёв сверху"
          value={p.topLayerCount}
          min={1}
          max={20}
          step={1}
          unit=""
          onChange={(v) => set("topLayerCount", Math.round(v))}
        />
        <NumberField
          label="Толщина ткани"
          value={p.fabricThickness}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("fabricThickness", v)}
        />
        <NumberField
          label="Зазор ткани"
          value={p.fabricClearance}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("fabricClearance", v)}
        />
      </div>
      <div className="print-stack">
        <div>
          <b>01</b>
          <span>
            Нижний PLA
            <small>
              {h.bottom.toFixed(2)} мм · {p.bottomLayerCount} слоя
            </small>
          </span>
        </div>
        <div>
          <b>02</b>
          <span>
            Пауза → ткань<small>После слоя {p.pauseAfterLayer}</small>
          </span>
        </div>
        <div>
          <b>03</b>
          <span>
            Верхний PLA
            <small>
              {h.top.toFixed(2)} мм · {p.topLayerCount} слоя
            </small>
          </span>
        </div>
      </div>
      <Toggle
        label="Рассчитывать Z продолжения"
        checked={p.resumeAuto}
        onChange={() => set("resumeAuto", !p.resumeAuto)}
      />
      <NumberField
        label="Z сопла при продолжении"
        value={p.recommendedResumeZ}
        min={0.05}
        max={20}
        step={0.01}
        disabled={p.resumeAuto}
        onChange={(v) => set("recommendedResumeZ", v)}
      />
      <p className="note">
        Расчёт: {h.bottom.toFixed(2)} + {p.fabricThickness} +{" "}
        {p.fabricClearance} + {p.normalLayerHeight} = {h.resume.toFixed(2)} мм.
        <br />
        Основание верхней геометрии: {h.topStart.toFixed(2)} мм.
      </p>
      <div className="soft-callout">
        Начальные значения требуют пробной печати. Пауза настраивается в
        слайсере; STL её не содержит.
      </div>
    </>
  );
}
