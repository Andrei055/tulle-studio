"use client";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  FlipHorizontal2,
  FlipVertical2,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignEndVertical,
} from "lucide-react";
import { useEditor } from "../state/editor";
import { NumberField, Toggle } from "./Fields";
import { assetById } from "../library";
import { aligned, centered, mirrored, transform } from "../geometry/transforms";
import { bounds, centroid, type Paths } from "../geometry/polygons";
export type TargetRegion =
  | "envelope"
  | "allowed"
  | "back"
  | "flap"
  | "pocket"
  | "object";
export function Properties({
  region,
  target,
  setTarget,
}: {
  region: Paths;
  target: TargetRegion;
  setTarget: (x: TargetRegion) => void;
}) {
  const s = useEditor(),
    selected = s.project.ornaments.filter((o) => s.selection.includes(o.id)),
    o = selected[0],
    locked = s.project.layers.ornaments.locked || o?.locked;
  function action(
    fn: (o: (typeof selected)[number]) => (typeof selected)[number],
  ) {
    s.commit((p) => {
      p.ornaments = p.ornaments.map((x) =>
        s.selection.includes(x.id) && !x.locked && !p.layers.ornaments.locked
          ? fn(x)
          : x,
      );
    });
  }
  function mirror(axis: "x" | "y", copy = false) {
    if (copy) {
      const clones = selected
        .filter((x) => !x.locked)
        .map((x) => ({
          ...mirrored(x, axis, centroid(region)),
          id: crypto.randomUUID(),
        }));
      s.commit((p) => {
        if (!p.layers.ornaments.locked) p.ornaments.push(...clones);
      });
      s.select(clones.map((x) => x.id));
    } else action((x) => mirrored(x, axis, centroid(region)));
  }
  return (
    <>
      <div className="panel-heading">
        <span className="eyebrow">СВОЙСТВА</span>
        <span className="count">{selected.length || "—"}</span>
      </div>
      {!o ? (
        <div className="empty-selection">
          <div className="selection-glyph">⌘</div>
          <h3>
            Каждая деталь
            <br />
            на своём месте
          </h3>
          <p>Выберите орнамент на холсте или добавьте его из библиотеки.</p>
          <p className="note">
            Точные координаты, масштаб и симметрия появятся здесь.
          </p>
        </div>
      ) : (
        <>
          <h3>
            {selected.length > 1
              ? `${selected.length} орнамента`
              : assetById(o.assetId).name}
          </h3>
          <div className="object-actions">
            <button
              title="Дублировать"
              aria-label="Дублировать"
              disabled={locked}
              onClick={() => {
                const copies = selected.map((x) => ({
                  ...x,
                  id: crypto.randomUUID(),
                  x: x.x + 5,
                  y: x.y + 5,
                }));
                s.commit((p) => {
                  p.ornaments.push(...copies);
                });
                s.select(copies.map((x) => x.id));
              }}
            >
              <Copy size={16} />
            </button>
            <button
              title="Заблокировать"
              aria-label={o.locked ? "Разблокировать" : "Заблокировать"}
              onClick={() =>
                s.commit((p) => {
                  p.ornaments.forEach((x) => {
                    if (s.selection.includes(x.id)) x.locked = !o.locked;
                  });
                })
              }
            >
              {o.locked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <button
              title="Удалить"
              aria-label="Удалить"
              disabled={locked}
              onClick={() => {
                s.commit((p) => {
                  p.ornaments = p.ornaments.filter(
                    (x) => !s.selection.includes(x.id) || x.locked,
                  );
                });
                s.select([]);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="field-grid">
            <NumberField
              label="Позиция X"
              value={o.x}
              onChange={(v) => s.patchInstances({ x: v })}
              disabled={locked}
            />
            <NumberField
              label="Позиция Y"
              value={o.y}
              onChange={(v) => s.patchInstances({ y: v })}
              disabled={locked}
            />
            <NumberField
              label="Масштаб X"
              value={o.scaleX}
              min={0.1}
              max={8}
              unit="×"
              disabled={locked}
              onChange={(v) => s.patchInstances({ scaleX: v })}
            />
            <NumberField
              label="Масштаб Y"
              value={o.scaleY}
              min={0.1}
              max={8}
              unit="×"
              disabled={locked}
              onChange={(v) => s.patchInstances({ scaleY: v })}
            />
          </div>
          <NumberField
            label="Поворот"
            value={o.rotation}
            min={-360}
            max={360}
            step={1}
            unit="°"
            disabled={locked}
            onChange={(v) => s.patchInstances({ rotation: v })}
          />
          <p className="note">
            Габарит: {bounds(transform(o)).width.toFixed(2)} ×{" "}
            {bounds(transform(o)).height.toFixed(2)} мм
            {selected.length > 1 && " · показан первый объект"}
          </p>
          <div className="section-label">Центровка и симметрия</div>
          <label className="field">
            <span>Относительно</span>
            <select
              value={target}
              onChange={(ev) => setTarget(ev.target.value as TargetRegion)}
            >
              <option value="envelope">Вся развёртка</option>
              <option value="allowed">Допустимая область</option>
              <option value="back">Спинка конверта</option>
              <option value="flap">Клапан</option>
              <option value="pocket">Карман</option>
              <option value="object">Первый выбранный объект</option>
            </select>
          </label>
          <div className="alignment-grid">
            {(
              [
                ["left", AlignStartVertical, "По левому краю"],
                ["x", AlignHorizontalJustifyCenter, "Центр по горизонтали"],
                ["right", AlignEndVertical, "По правому краю"],
                ["top", AlignStartHorizontal, "По верхнему краю"],
                ["y", AlignVerticalJustifyCenter, "Центр по вертикали"],
                ["bottom", AlignEndHorizontal, "По нижнему краю"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                title={label}
                aria-label={label}
                disabled={locked}
                onClick={() =>
                  action((x) =>
                    id === "x" || id === "y"
                      ? centered(x, region, id)
                      : aligned(x, region, id),
                  )
                }
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
          <div className="mirror-grid">
            <button disabled={locked} onClick={() => mirror("x")}>
              <FlipHorizontal2 size={16} />
              Отразить X
            </button>
            <button disabled={locked} onClick={() => mirror("y")}>
              <FlipVertical2 size={16} />
              Отразить Y
            </button>
            <button disabled={locked} onClick={() => mirror("x", true)}>
              Копия по X
            </button>
            <button disabled={locked} onClick={() => mirror("y", true)}>
              Копия по Y
            </button>
          </div>
          <p className="note">
            X: относительно вертикальной оси.
            <br />
            Y: относительно горизонтальной оси.
            <br />
            Центр области: {centroid(region).x.toFixed(2)};{" "}
            {centroid(region).y.toFixed(2)} мм.
          </p>
          <div className="section-label">Печатать орнамент</div>
          <Toggle
            label="Нижний PLA"
            checked={o.bottom}
            onChange={() => s.patchInstances({ bottom: !o.bottom })}
          />
          <Toggle
            label="Верхний PLA"
            checked={o.top}
            onChange={() => s.patchInstances({ top: !o.top })}
          />
        </>
      )}
      <div className="inspector-footer">
        <span className="small-dot" />
        Все размеры в миллиметрах
      </div>
    </>
  );
}
