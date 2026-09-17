# План

## Первый vertical slice (эта итерация)
1. Документация и фиксированные допущения конструкции.
2. Валидируемая schema, integer polygon ядро, контуры, offsets, keep-outs.
3. Шесть векторных assets, transforms, центрирование, symmetry, preset compositions.
4. SVG editor: выбор/множественный выбор, drag, числовые scale/rotation, clone/delete/lock, snapping, grid/guides, zoom/pan; undo/redo.
5. Настройки изделия/клапана/рамки/волн/печати; слои; reference image с преобразованиями.
6. Manufacturing polygons → замкнутые extrusions → 3D orbit preview; SVG/STL/JSON.
7. Проверки размеров, keep-outs, offset width, centroid, зеркал, manifold, сериализации и rebuild; production build и browser smoke.

## Далее
- Физический купон печати: реальные ткань/слои/шарнир/соединение боковин. Измерить образец, подтвердить топологию развёртки.
- Каталог художественных SVG, импорт с sanitization и curve tolerance; группы, spacing/distribution, live symmetry; worker для тяжёлых геометрий.
- Исследование реальных Bambu 3MF и printer presets.
- Валидируемый DesignSpec от LLM; только после deterministic preview и manufacturing checks.
- Image-to-design после reference tracing; не обещать точную реконструкцию по фотографии.

Критерий среза: изменение размеров меняет производственную геометрию; отверстия и гибкие зоны сохраняются в SVG и STL; JSON возвращает редактируемые объекты. Дизайн UI вторичен. MVP не является сертификацией печатной технологии или готовым слайсером.
