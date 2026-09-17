# Tulle Studio — архитектура первого vertical slice

2026-09-17. Репозиторий при начале работы пуст. Исходные материалы: две пользовательские фотографии, описание задачи, printesso.ru. MakerWorld https://makerworld.com/models/2916875?appSharePlatform=copy недоступен при исследовании; ни размеры, ни файлы, ни настройки модели не подтверждены.

## Поток данных
Project JSON (version: 1) → schema validation → параметрическая 2D геометрия в мм → integer Clipper offset/union/difference/intersection → ManufacturingModel {bottom, top, fabric, profile} → экструзия → Three.js preview / STL. SVG выводится из тех же производственных полигонов. Ни React, ни Three.js не являются источником геометрии.

## Модули
- domain: Zod schema, ограничения параметров, значения по умолчанию, DesignSpec boundary.
- geometry: 2D polygon kernel, контур, рамки, сгибы, разрешённая область, трансформации, выравнивание, centroid, symmetry.
- library: JSON registry с замкнутыми векторными полигонами и SVG previews; immutable assets и независимые instances.
- state: Zustand, история проекта, выделение; transient zoom/pan отдельно от сохранённого проекта.
- manufacturing: вычисление высот и построение замкнутых тел, контроль mesh.
- components: 2D editor, свойства, библиотека, 3D renderer.
- export: SVG в мм, binary STL, редактируемый JSON.
- tests: независимые математические инварианты и round-trip схемы.

Next.js static export + React + TypeScript. Всё вычисляется локально в браузере. Нет загрузки пользовательских проектов на сервер, авторизации, LLM вызовов или заявлений об AI реконструкции. Clipper работает с integer scale=1000 (0.001 мм); исходные кривые дискретизируются. Three.js служит только для mesh/preview/export. Сложные каталоги в будущем требуют Web Worker и лимитов сложности.

## Границы
Первый срез — редактор плоской производственной развёртки, не симулятор механики. Боковое скрепление кармана после складывания не подтверждено фотографиями и не генерируется. STL не содержит пауз, ткани или настроек принтера; профиль экспортируется отдельно. AI DesignSpec проходит ту же schema и geometry pipeline. 3MF/Bambu exporter отложен до исследования реальных контейнеров.
