# Производственная модель PLA / ткань / PLA

## Последовательность
1. Нижний PLA на столе (Z=0), печать заданного числа слоёв.
2. Пауза после bottomLayerCount; пользователь укладывает/натягивает сетку.
3. Верхний PLA захватывает сетку. Его footprints независимы, по умолчанию совпадают с нижними.
4. Снятие плоской заготовки, сгибание по оставленным тканевым шарнирам и проверка способа скрепления боковин.

Нельзя считать сплошную ткань обычным печатаемым зазором: расплав должен захватить отверстия сетки. Числа по умолчанию — стартовые предположения для калибровочного купона, а не профиль с фотографий.

## PrintProfile
printer (описание), nozzleDiameter, firstLayerHeight, normalLayerHeight, bottomLayerCount, topLayerCount, fabricThickness, fabricClearance, pauseAfterLayer, recommendedResumeZ. Все длины в мм. Bottom height B=firstLayerHeight+(bottomLayerCount−1)×normalLayerHeight. Top height T=topLayerCount×normalLayerHeight. Geometric top start=B+fabricThickness+fabricClearance. Рекомендация nozzle Z для первого верхнего слоя=B+fabricThickness+fabricClearance+normalLayerHeight. Последнее число не равно основанию mesh. Ручное значение recommendedResumeZ допускается и отмечается; pauseAfterLayer должен совпадать с количеством нижних слоёв при данном pipeline.

Визуальный exploded view разводит слои только на экране, экспорт сохраняет настоящие Z. Fabric — прозрачная плоскость/сетка, не mesh для STL. Bottom/top могут экспортироваться отдельно либо одним STL как несколько замкнутых тел. STL не хранит единицы формально: документированная конвенция — мм. При импорте в слайсер сохранять исходные координаты Z; при автоматическом drop-to-bed верхней части они будут потеряны. Пауза и настройки добавляются вручную в слайсере по скачанному профилю. Не выдавать такой STL за готовый G-code.

## Проверки и неизвестное
Положительные layer heights, целые количества, область каждой PLA детали вне keep-out, корректные winding/holes, конечные треугольники, ненулевые площади, каждое геометрическое ребро принадлежит двум граням, положительный объём. Проверять клиппированные тонкие fragments относительно сопла. Не доказаны: адгезия к ткани, достаточный радиус сгиба, усадка, температура, реальные допуски, скрепление боковин, размер стола.

3MF не реализуется без файла. Будущий разбор: ZIP entries, 3D/*.model, build/items, transforms, meshes/triangles, Metadata, plate information, Bambu extensions, slice config, pause/custom G-code; не исполнять вложенный код. Будущие printer presets в том числе Bambu должны иметь источник и версию.
