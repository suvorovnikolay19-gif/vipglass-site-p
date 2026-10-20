# Детализация конструкций VIPGlass

Дата: 16 октября 2026 года.

## Результат

Обновлены только `dist/mirror-tree.mjs`, `dist/other-trees.mjs`, `dist/showers-tree.mjs` и этот отчёт. Визуальные чертежи и схемы не добавлялись. Интерфейс карточного справочника дорабатывается отдельно.

| Направление | Листьев до | Листьев после | Всего страниц после |
|---|---:|---:|---:|
| Зеркала | 86 | 119 | 201 |
| Душевые | 49 | 51 | 77 |
| Перегородки | 16 | 24 | 46 |
| Двери | 10 | 15 | 29 |
| Лестницы и ограждения | 43 | 58 | 108 |
| Козырьки | 16 | 18 | 35 |

Итого: 220 → 285 конечных карточек; 384 → 496 страниц. 47 старых конечных карточек стали страницами выбора с прежним id и адресом. Под ними появились 112 конечных карточек: чистый прирост 65 моделей.

## Содержание изменений

- Зеркала: мягкая рама с кожей и тканью разделена. У двух прямоугольных зеркал с фацетом и четырёх фацетных панно доступны отдельные ширины 10, 20, 30, 40 мм и индивидуальная. Для округлых, арочных и свободных контуров отдельно выбираются полировка и фацет; ширина фигурного фацета индивидуальная, без умножения всех вариантов.
- Фацет: `preset.bevelWidthMm` — число для фиксированной ширины, пустая строка для индивидуальной; `preset.bevelWidth` и `preset.bevel` содержат читаемые значения. Возможность выбранной обработки согласуется по толщине, контуру и размерам элемента.
- Душевые: книжка с неподвижным добором разделена по опоре на стену и на добор; экран с вырезом — по обходу стенового выступа и встроенной скамьи.
- Перегородки: семь неопределённых дверных компоновок разделены на распашные и раздвижные. Старый многополотный вариант стал выбором встречного парного и телескопического открывания. Однополотная карточка сохранила прежний адрес и получила явные параметры механизма.
- Двери: пять компоновок с боковым остеклением разделены на одну и две неподвижные боковые панели.
- Лестницы: три поворотные компоновки разделены на площадку и забежные ступени. У двенадцати исполнений ограждений в профиле отдельно выбираются верхний и торцевой узлы крепления; все новые конструктивные варианты имеют статус `structure` и требуют проверки системы.
- Козырьки: в дереве применяется однозначное название «на тягах». Два общих варианта индивидуального контура разделены на плоскую деталь со срезанными углами и плоскую деталь с радиусным краем. Радиусный контур не означает гнутую поверхность.

## Источники для механизмов и опор

- [Официальный каталог Vetro](https://vetro-furniture.ru/catalog/) — прочитан 16.10.2026. В разделе дверей и перегородок прямо выделена серия SDS Telescopic. Подтверждает самостоятельность телескопического механизма; количество полотен, допустимые размеры и нагрузка в VIPGlass из этого источника не переносились. Ранее зафиксированная карточка `/catalog/razdvizhnye_dveri_/teleskopicheskaya_razdvizhnaya_sistema/5867/` при повторном прямом открытии оказалась недоступна; использован читаемый каталог.
- [Официальная страница Bohle VetroMount](https://www.bohle.com/uk-EN/product-groups/glass-railings/vetromount-balustrade-system/) — прочитана 16.10.2026. Раздел Profile variants различает напольные и боковые профили; на странице также указан компонент бокового профиля для лестницы. Это основание для раздельного выбора верхнего и торцевого узла, а не подтверждение применимости любого профиля на любом объекте. Нагрузки, анкеры и толщины не перенесены в каталог.
- Для новых душевых вариантов использованы исследования `docs/showers-research-a.md`, `docs/showers-research-b.md`, `docs/showers-research-c.md` и согласованное разделение опор/обходов. Конкретные петли и стабилизация опорного добора подбираются по системе.
- Ширины фацета 10/20/30/40 мм — согласованные пользователем варианты выбора. Возможность изготовления для каждого зеркала проверяется по его параметрам.

## Сохранность и проверка

- Все 384 старых канонических адреса найдены в обновлённом дереве.
- Ни одна изменённая карточка не перенаправлена на произвольно выбранное исполнение: прежний URL показывает страницу выбора.
- Импорт `catalog-tree.mjs` проходит; все конечные `solutionId` существуют.
- Нет пустых или одноэлементных веток, конечных узлов с дочерними страницами и дублирующихся путей.
- У новых конструктивных моделей есть явная композиция; у новых душевых — application, opening, geometry, mounting, configuration.
- Проверено, что `solutionForNode` сохраняет выбранное открывание, а базовый solution его не подменяет.
- Проверены тип и допустимые фиксированные значения `bevelWidthMm`.
- В пользовательских строках дерева козырьков слово «ванты» отсутствует. Вне области этого изменения прежние строки `dist/catalog.mjs` переданы основному агенту для согласования; статические HTML требуют общего пререндера после завершения остальных задач.

## Старые конечные карточки, ставшие страницами выбора

Все перечисленные адреса сохранены. Новые ids добавляются дочерним сегментом к указанному адресу.

### Зеркала

- Старый адрес: `/catalog/mirrors/with-light/dressing/full-length/soft-frame`.
  Дочерние ids: `leather`, `fabric`.
- Старый адрес: `/catalog/mirrors/frameless/rectangular/bevel/portrait`.
  Дочерние ids: `10-mm`, `20-mm`, `30-mm`, `40-mm`, `custom`.
- Старый адрес: `/catalog/mirrors/frameless/rectangular/bevel/landscape`.
  Дочерние ids: `10-mm`, `20-mm`, `30-mm`, `40-mm`, `custom`.
- Старый адрес: `/catalog/mirrors/frameless/rounded/round/single`.
  Дочерние ids: `polished-edge`, `bevel`.
- Старый адрес: `/catalog/mirrors/frameless/rounded/round/pair`.
  Дочерние ids: `polished-edge`, `bevel`.
- Старый адрес: `/catalog/mirrors/frameless/rounded/oval/single`.
  Дочерние ids: `polished-edge`, `bevel`.
- Старый адрес: `/catalog/mirrors/frameless/rounded/oval/pair`.
  Дочерние ids: `polished-edge`, `bevel`.
- Старый адрес: `/catalog/mirrors/frameless/arched/full-length`.
  Дочерние ids: `polished-edge`, `bevel`.
- Старый адрес: `/catalog/mirrors/frameless/arched/wide`.
  Дочерние ids: `polished-edge`, `bevel`.
- Старый адрес: `/catalog/mirrors/frameless/free-outline/wave`.
  Дочерние ids: `polished-edge`, `bevel`.
- Старый адрес: `/catalog/mirrors/frameless/free-outline/asymmetric`.
  Дочерние ids: `polished-edge`, `bevel`.
- Старый адрес: `/catalog/mirrors/panels/bevel/diamonds/regular`.
  Дочерние ids: `10-mm`, `20-mm`, `30-mm`, `40-mm`, `custom`.
- Старый адрес: `/catalog/mirrors/panels/bevel/diamonds/elongated`.
  Дочерние ids: `10-mm`, `20-mm`, `30-mm`, `40-mm`, `custom`.
- Старый адрес: `/catalog/mirrors/panels/bevel/rectangles/aligned`.
  Дочерние ids: `10-mm`, `20-mm`, `30-mm`, `40-mm`, `custom`.
- Старый адрес: `/catalog/mirrors/panels/bevel/rectangles/staggered`.
  Дочерние ids: `10-mm`, `20-mm`, `30-mm`, `40-mm`, `custom`.

### Душевые

- Старый адрес: `/catalog/showers/showers-niche/showers-niche-folding/showers-niche-folding-with-fixed`.
  Дочерние ids: `showers-niche-folding-with-fixed-wall-hinged`, `showers-niche-folding-with-fixed-glass-hinged`.
- Старый адрес: `/catalog/showers/showers-custom/showers-custom-cutout`.
  Дочерние ids: `showers-custom-cutout-wall-projection`, `showers-custom-cutout-bench`.

### Перегородки

- Старый адрес: `/catalog/partitions/partitions-home/partitions-home-frame/partitions-home-frame-door/partitions-home-frame-door-single`.
  Дочерние ids: `partitions-home-frame-door-single-swing-single`, `partitions-home-frame-door-single-sliding-single`.
- Старый адрес: `/catalog/partitions/partitions-home/partitions-home-frame/partitions-home-frame-door/partitions-home-frame-door-pair`.
  Дочерние ids: `partitions-home-frame-door-pair-swing-pair`, `partitions-home-frame-door-pair-sliding-pair`.
- Старый адрес: `/catalog/partitions/partitions-home/partitions-home-sliding/partitions-home-sliding-multiple`.
  Дочерние ids: `partitions-home-sliding-multiple-opposed-pair`, `partitions-home-sliding-multiple-telescopic`.
- Старый адрес: `/catalog/partitions/partitions-office/partitions-office-clear/partitions-office-clear-meeting/partitions-office-clear-meeting-wall`.
  Дочерние ids: `partitions-office-clear-meeting-wall-swing-single`, `partitions-office-clear-meeting-wall-sliding-single`.
- Старый адрес: `/catalog/partitions/partitions-office/partitions-office-clear/partitions-office-clear-meeting/partitions-office-clear-meeting-corner`.
  Дочерние ids: `partitions-office-clear-meeting-corner-swing-single`, `partitions-office-clear-meeting-corner-sliding-single`.
- Старый адрес: `/catalog/partitions/partitions-office/partitions-office-frame/partitions-office-frame-meeting/partitions-office-frame-meeting-wall`.
  Дочерние ids: `partitions-office-frame-meeting-wall-swing-single`, `partitions-office-frame-meeting-wall-sliding-single`.
- Старый адрес: `/catalog/partitions/partitions-office/partitions-office-frame/partitions-office-frame-meeting/partitions-office-frame-meeting-corner`.
  Дочерние ids: `partitions-office-frame-meeting-corner-swing-single`, `partitions-office-frame-meeting-corner-sliding-single`.
- Старый адрес: `/catalog/partitions/partitions-office/partitions-office-frame/partitions-office-frame-zones/partitions-office-frame-zones-entry`.
  Дочерние ids: `partitions-office-frame-zones-entry-swing-single`, `partitions-office-frame-zones-entry-sliding-single`.

### Двери

- Старый адрес: `/catalog/doors/doors-swing/doors-swing-single/doors-swing-single-side-glass`.
  Дочерние ids: `doors-swing-single-side-glass-one-side`, `doors-swing-single-side-glass-two-sides`.
- Старый адрес: `/catalog/doors/doors-swing/doors-swing-pair/doors-swing-pair-equal/doors-swing-pair-equal-side-glass`.
  Дочерние ids: `doors-swing-pair-equal-side-glass-one-side`, `doors-swing-pair-equal-side-glass-two-sides`.
- Старый адрес: `/catalog/doors/doors-swing/doors-swing-pair/doors-swing-pair-unequal/doors-swing-pair-unequal-side-glass`.
  Дочерние ids: `doors-swing-pair-unequal-side-glass-one-side`, `doors-swing-pair-unequal-side-glass-two-sides`.
- Старый адрес: `/catalog/doors/doors-sliding/doors-sliding-single/doors-sliding-single-glass`.
  Дочерние ids: `doors-sliding-single-glass-one-side`, `doors-sliding-single-glass-two-sides`.
- Старый адрес: `/catalog/doors/doors-sliding/doors-sliding-pair/doors-sliding-pair-side-glass`.
  Дочерние ids: `doors-sliding-pair-side-glass-one-side`, `doors-sliding-pair-side-glass-two-sides`.

### Лестницы и ограждения

- Старый адрес: `/catalog/stairs/stairs-complete/stairs-complete-metal-rail/stairs-complete-metal-rail-turning`.
  Дочерние ids: `stairs-complete-metal-rail-turning-landing`, `stairs-complete-metal-rail-turning-winders`.
- Старый адрес: `/catalog/stairs/stairs-complete/stairs-complete-metal-steps/stairs-complete-metal-steps-turning`.
  Дочерние ids: `stairs-complete-metal-steps-turning-landing`, `stairs-complete-metal-steps-turning-winders`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-stair-flight/stairs-railings-stair-flight-profile/stairs-railings-stair-flight-profile-with-handrail/stairs-railings-stair-flight-profile-with-handrail-metal`.
  Дочерние ids: `stairs-railings-stair-flight-profile-with-handrail-metal-top-mount`, `stairs-railings-stair-flight-profile-with-handrail-metal-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-stair-flight/stairs-railings-stair-flight-profile/stairs-railings-stair-flight-profile-with-handrail/stairs-railings-stair-flight-profile-with-handrail-wood`.
  Дочерние ids: `stairs-railings-stair-flight-profile-with-handrail-wood-top-mount`, `stairs-railings-stair-flight-profile-with-handrail-wood-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-stair-flight/stairs-railings-stair-flight-profile/stairs-railings-stair-flight-profile-without-handrail`.
  Дочерние ids: `stairs-railings-stair-flight-profile-without-handrail-top-mount`, `stairs-railings-stair-flight-profile-without-handrail-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-second-light/stairs-railings-second-light-profile/stairs-railings-second-light-profile-with-handrail/stairs-railings-second-light-profile-with-handrail-metal`.
  Дочерние ids: `stairs-railings-second-light-profile-with-handrail-metal-top-mount`, `stairs-railings-second-light-profile-with-handrail-metal-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-second-light/stairs-railings-second-light-profile/stairs-railings-second-light-profile-with-handrail/stairs-railings-second-light-profile-with-handrail-wood`.
  Дочерние ids: `stairs-railings-second-light-profile-with-handrail-wood-top-mount`, `stairs-railings-second-light-profile-with-handrail-wood-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-second-light/stairs-railings-second-light-profile/stairs-railings-second-light-profile-without-handrail`.
  Дочерние ids: `stairs-railings-second-light-profile-without-handrail-top-mount`, `stairs-railings-second-light-profile-without-handrail-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-mezzanine/stairs-railings-mezzanine-profile/stairs-railings-mezzanine-profile-with-handrail/stairs-railings-mezzanine-profile-with-handrail-metal`.
  Дочерние ids: `stairs-railings-mezzanine-profile-with-handrail-metal-top-mount`, `stairs-railings-mezzanine-profile-with-handrail-metal-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-mezzanine/stairs-railings-mezzanine-profile/stairs-railings-mezzanine-profile-with-handrail/stairs-railings-mezzanine-profile-with-handrail-wood`.
  Дочерние ids: `stairs-railings-mezzanine-profile-with-handrail-wood-top-mount`, `stairs-railings-mezzanine-profile-with-handrail-wood-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-mezzanine/stairs-railings-mezzanine-profile/stairs-railings-mezzanine-profile-without-handrail`.
  Дочерние ids: `stairs-railings-mezzanine-profile-without-handrail-top-mount`, `stairs-railings-mezzanine-profile-without-handrail-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-outdoor/stairs-railings-outdoor-profile/stairs-railings-outdoor-profile-with-handrail/stairs-railings-outdoor-profile-with-handrail-metal`.
  Дочерние ids: `stairs-railings-outdoor-profile-with-handrail-metal-top-mount`, `stairs-railings-outdoor-profile-with-handrail-metal-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-outdoor/stairs-railings-outdoor-profile/stairs-railings-outdoor-profile-with-handrail/stairs-railings-outdoor-profile-with-handrail-wood`.
  Дочерние ids: `stairs-railings-outdoor-profile-with-handrail-wood-top-mount`, `stairs-railings-outdoor-profile-with-handrail-wood-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-railings/stairs-railings-outdoor/stairs-railings-outdoor-profile/stairs-railings-outdoor-profile-without-handrail`.
  Дочерние ids: `stairs-railings-outdoor-profile-without-handrail-top-mount`, `stairs-railings-outdoor-profile-without-handrail-side-mount`.
- Старый адрес: `/catalog/stairs/stairs-glass-steps/stairs-glass-steps-sets/stairs-glass-steps-sets-turning`.
  Дочерние ids: `stairs-glass-steps-sets-turning-landing`, `stairs-glass-steps-sets-turning-winders`.

### Козырьки

- Старый адрес: `/catalog/canopies/canopies-rods/canopies-rods-single/canopies-rods-single-door/canopies-rods-single-door-contour`.
  Дочерние ids: `canopies-rods-single-door-contour-cut-corners`, `canopies-rods-single-door-contour-radius-outline`.
- Старый адрес: `/catalog/canopies/canopies-profile/canopies-profile-single/canopies-profile-single-door/canopies-profile-single-door-contour`.
  Дочерние ids: `canopies-profile-single-door-contour-cut-corners`, `canopies-profile-single-door-contour-radius-outline`.

