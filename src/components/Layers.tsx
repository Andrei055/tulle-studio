"use client";
import { Eye, EyeOff, Lock, Unlock, ImagePlus } from "lucide-react";
import { useEditor } from "../state/editor";
import { assetById } from "../library";
import { NumberField } from "./Fields";
export function Layers() {
  const s = useEditor();
  return (
    <>
      <p className="eyebrow">СТРУКТУРА ПРОЕКТА</p>
      <h2>
        Всё
        <br />
        <em>по слоям.</em>
      </h2>
      <p className="note">
        Рамка и орнаменты: скрытие исключает геометрию из экспорта. PLA и ткань:
        видимость только в 3D.
      </p>
      {(
        Object.entries({
          border: "Рамка",
          ornaments: "Орнаменты",
          fabric: "Ткань",
          bottom: "Нижний PLA · 3D",
          top: "Верхний PLA · 3D",
        }) as [keyof typeof s.project.layers, string][]
      ).map(([key, name]) => (
        <div className="layer-row" key={key}>
          <span>{name}</span>
          <button
            aria-label={`Видимость: ${name}`}
            onClick={() =>
              s.commit((p) => {
                p.layers[key].visible = !p.layers[key].visible;
              })
            }
          >
            {s.project.layers[key].visible ? (
              <Eye size={16} />
            ) : (
              <EyeOff size={16} />
            )}
          </button>
          {key === "ornaments" && (
            <button
              aria-label="Блокировка слоя орнаментов"
              onClick={() =>
                s.commit((p) => {
                  p.layers.ornaments.locked = !p.layers.ornaments.locked;
                })
              }
            >
              {s.project.layers[key].locked ? (
                <Lock size={15} />
              ) : (
                <Unlock size={15} />
              )}
            </button>
          )}
        </div>
      ))}
      <div className="section-label">
        Объекты · {s.project.ornaments.length}
      </div>
      <div className="object-list">
        {s.project.ornaments.map((o, i) => (
          <div
            className={
              "layer-row " + (s.selection.includes(o.id) ? "selected" : "")
            }
            key={o.id}
          >
            <button className="object-name" onClick={() => s.select([o.id])}>
              {assetById(o.assetId).name} <small>{i + 1}</small>
            </button>
            <button
              aria-label={`Видимость объекта ${i + 1}`}
              onClick={() =>
                s.commit((p) => {
                  p.ornaments.find((x) => x.id === o.id)!.visible = !o.visible;
                })
              }
            >
              {o.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              aria-label={`Блокировка объекта ${i + 1}`}
              onClick={() =>
                s.commit((p) => {
                  p.ornaments.find((x) => x.id === o.id)!.locked = !o.locked;
                })
              }
            >
              {o.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
export function Reference() {
  const s = useEditor(),
    r = s.project.reference;
  async function load(file: File) {
    if (
      file.size > 4500000 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      s.set({ error: "Используйте PNG, JPEG или WebP до 4,5 МБ." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      s.commit((p) => {
        p.reference = {
          dataUrl: String(reader.result),
          x: 0,
          y: 0,
          width: p.envelope.width,
          rotation: 0,
          opacity: 0.4,
        };
      });
    reader.onerror = () => s.set({ error: "Не удалось прочитать изображение" });
    reader.readAsDataURL(file);
  }
  return (
    <>
      <p className="eyebrow">РЕФЕРЕНС</p>
      <h2>
        От идеи
        <br />
        <em>к форме.</em>
      </h2>
      <label className="upload-zone">
        <ImagePlus size={26} />
        <span>{r ? "Заменить изображение" : "Добавить изображение"}</span>
        <small>PNG, JPEG, WebP · до 4,5 МБ</small>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (f) void load(f);
            ev.target.value = "";
          }}
        />
      </label>
      {r && (
        <>
          <div className="field-grid">
            <NumberField
              label="Референс X"
              value={r.x}
              onChange={(v) =>
                s.commit((p) => {
                  p.reference!.x = v;
                })
              }
            />
            <NumberField
              label="Референс Y"
              value={r.y}
              onChange={(v) =>
                s.commit((p) => {
                  p.reference!.y = v;
                })
              }
            />
            <NumberField
              label="Ширина картинки"
              value={r.width}
              min={10}
              max={600}
              onChange={(v) =>
                s.commit((p) => {
                  p.reference!.width = v;
                })
              }
            />
            <NumberField
              label="Поворот картинки"
              value={r.rotation}
              min={-360}
              max={360}
              unit="°"
              onChange={(v) =>
                s.commit((p) => {
                  p.reference!.rotation = v;
                })
              }
            />
          </div>
          <NumberField
            label="Прозрачность картинки"
            value={r.opacity}
            min={0}
            max={1}
            step={0.05}
            unit=""
            onChange={(v) =>
              s.commit((p) => {
                p.reference!.opacity = v;
              })
            }
          />
          <button
            className="outline full"
            onClick={() =>
              s.commit((p) => {
                p.reference = null;
              })
            }
          >
            Удалить подложку
          </button>
        </>
      )}
      <div className="soft-callout">
        Подложка для ручного построения. Изображение не превращается
        автоматически в печатную геометрию.
      </div>
      <p className="note">
        Изображение остаётся в браузере и сохраняется внутри JSON проекта. В SVG
        и STL его нет.
      </p>
    </>
  );
}
