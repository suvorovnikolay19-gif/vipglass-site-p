# Отдельные процессы производства

## Итог перестройки

Видимый каталог: **27 самостоятельных процессов, 134 узла, 98 конечных вариантов**. Все 46 прежних конечных операций сохранены с исходными ID; изменилось место в дереве и, где нужно, уточнилось название. Шесть прежних укрупнённых семей больше не служат входами в каталог. Внутренняя legacy-структура в модуле нужна только для сохранения прежнего содержания и получения таблицы адресов; она не экспортируется как публичное дерево.

Сверление, зенковка, вырезы и пазы разделены. Шлифовка, полировка, притупление рёбер и фацет разделены. Моллирование, закалка и гнутьё с закалкой разделены. Механическая и лазерная гравировка, покраска и керамическое эмалирование, УФ-печать, керамическая печать и шелкография также имеют собственные входы.

## Корневые процессы

| ID | Название | Конечных вариантов |
|---|---|---:|
| `production-cutting` | Резка стекла и зеркал | 11 |
| `production-drilling` | Сверление отверстий | 4 |
| `production-countersinking` | Зенковка отверстий | 1 |
| `production-cutouts` | Вырезы в стекле и зеркалах | 7 |
| `production-grooves` | Пазы и прорези | 4 |
| `production-cnc` | Обработка по цифровому чертежу | 2 |
| `production-rounding` | Закругление углов | 1 |
| `production-arrising` | Притупление острых рёбер | 1 |
| `production-grinding` | Шлифовка кромки | 4 |
| `production-polishing` | Полировка кромки | 4 |
| `production-bevel` | Фацет — выбор ширины | 18 |
| `production-mitre` | Кромка под угловое соединение | 1 |
| `production-tempering` | Закалка стекла | 1 |
| `production-bending` | Моллирование стекла | 2 |
| `production-bending-tempering` | Гнутьё с закалкой | 1 |
| `production-lamination` | Триплексование | 8 |
| `production-sandblast` | Пескоструйное матирование | 5 |
| `production-mirror-light` | Световые зоны на зеркале | 4 |
| `production-mechanical-engraving` | Механическая гравировка | 1 |
| `production-laser-engraving` | Лазерная гравировка | 3 |
| `production-painting` | Покраска стекла | 1 |
| `production-enamelling` | Керамическое эмалирование | 1 |
| `production-uv-printing` | УФ-печать на стекле | 4 |
| `production-ceramic-printing` | Цифровая керамическая печать | 1 |
| `production-screen-printing` | Шелкография | 1 |
| `production-films` | Нанесение плёнок | 4 |
| `production-bonding` | УФ-склейка | 3 |

## Фацет и точная ширина

Два направления: прямолинейный и криволинейный. В каждом девять конечных страниц: 5, 10, 15, 20, 25, 30, 35, 40 мм и индивидуальная ширина. Итого 18 страниц. У стандартного выбора свойство `properties.bevelWidth` содержит, например, `10 мм`; у индивидуального — `Индивидуальная`. `properties.bevelGeometry` содержит `Прямолинейный` или `Криволинейный`.

Пример пути: `/production/production-bevel/production-bevel-straight-widths/production-bevel-straight-10`. Прежний ID `production-bevel-straight` сохранён у страницы индивидуальной ширины; аналогично `production-bevel-curved`. Для индивидуального варианта в brief прямо запрашивается точная ширина в мм. Интеграция формы должна давать числовое поле для этого значения и переносить его в задание; общий выбор материала не заменяет этот параметр.

Ширины являются выбираемыми параметрами заказа, а не заявлением об универсальной технологической возможности для любой толщины, любого контура или зеркала. В данных отдельно указана увязка ширины с толщиной, остаточным торцом и геометрией. Не вводятся универсальные углы фацета, допустимые толщины, отступы или максимальные размеры.

## Смысл дополнительных вариантов

Резка раскрыта через прямые и фигурные контуры: прямоугольник, полоса, многоугольник, круг, овал, арка, контур со скруглениями, шаблон и многослойная заготовка. Отдельная операция закругления углов задаётся численным радиусом. Вырезы различаются по узлу: петля, замок или фитинг, коннектор, розетка, оборудование. Пазы различают открытый проход от кромки, прорезь между отверстиями и обход препятствия.

Шлифовка и полировка различают прямой торец, фигурный контур, внутренний вырез и общий торец триплекса. Стекло и зеркало не умножены на одинаковые самостоятельные страницы: материал выбирается для одной и той же операции. Многослойный торец выделен, поскольку задание должно учитывать состав слоёв и прослойку. Лист с закалёнными слоями не предлагается как заготовка для последующей резки.

В декоре отдельные формы задания помогают подготовить макет: полосы, орнамент, надпись; периметральные и локальные световые зоны зеркала; векторная и растровая графика. Это варианты клиентского результата, а не утверждение о дополнительных станках. Подразделы с одной содержательной операцией оставлены без искусственного умножения страниц по цвету или количеству.

## Связи материалов и услуг

Экспорт `productionServiceGroups` позволяет преобразовать прежние serviceIds материалов в самостоятельные процессы. Связь означает направление для подбора обработки; совместимость конкретного состава и покрытия не следует автоматически из этой связи.

| Прежний ID семейства | Новые корневые процессы |
|---|---|
| `cutting-machining` | `production-cutting`, `production-drilling`, `production-countersinking`, `production-cutouts`, `production-grooves`, `production-cnc`, `production-rounding` |
| `edge-finishing` | `production-arrising`, `production-grinding`, `production-polishing`, `production-bevel`, `production-mitre` |
| `thermal-forming` | `production-tempering`, `production-bending`, `production-bending-tempering` |
| `lamination` | `production-lamination` |
| `surface-decoration` | `production-sandblast`, `production-mirror-light`, `production-mechanical-engraving`, `production-laser-engraving`, `production-painting`, `production-enamelling`, `production-uv-printing`, `production-ceramic-printing`, `production-screen-printing`, `production-films` |
| `bonding` | `production-bonding` |

При интеграции нужно развернуть старые group IDs и убрать повторения, прежде чем искать узлы в `servicesRoot.children`. Для новых операций по триплексу materialIds ограничены семейством laminated; плёнка на тыльную сторону зеркала связана с mirrors и films.

## Адреса и совместимость

Экспорт `productionPathAliases` покрывает все 70 прежних узлов, включая прежний корень. Все шесть старых агрегатов ведут на `/production`. Сохранённые операции ведут на соответствующий новый конечный узел; прежние объединённые ветви, не имеющие одного точного эквивалента, ведут на каталог процессов. Запись `/production → /production` является тождественной; потребители должны пропускать тождественные перенаправления. Алиасы не добавляются в видимое дерево и sitemap. Совместимые HTML-страницы должны иметь canonical на цель.

| Старый путь | Канонический путь |
|---|---|
| `/production` | `/production` |
| `/production/cutting-machining` | `/production` |
| `/production/cutting-machining/production-cutting` | `/production/production-cutting` |
| `/production/cutting-machining/production-cutting/production-cutting-straight` | `/production/production-cutting/production-cutting-straight-types/production-cutting-straight` |
| `/production/cutting-machining/production-cutting/production-cutting-shaped` | `/production/production-cutting/production-cutting-shaped-types/production-cutting-shaped` |
| `/production/cutting-machining/production-cutting/production-cutting-template` | `/production/production-cutting/production-cutting-template` |
| `/production/cutting-machining/production-drilling` | `/production/production-drilling` |
| `/production/cutting-machining/production-drilling/production-drilling-round` | `/production/production-drilling/production-drilling-round` |
| `/production/cutting-machining/production-drilling/production-drilling-countersink` | `/production/production-countersinking/production-drilling-countersink` |
| `/production/cutting-machining/production-cutouts` | `/production/production-cutouts` |
| `/production/cutting-machining/production-cutouts/production-cutout-hardware` | `/production/production-cutouts/production-cutouts-hardware/production-cutout-hardware` |
| `/production/cutting-machining/production-cutouts/production-cutout-internal` | `/production/production-cutouts/production-cutouts-internal/production-cutout-internal` |
| `/production/cutting-machining/production-cutouts/production-cutout-open` | `/production/production-grooves/production-cutout-open` |
| `/production/cutting-machining/production-cnc` | `/production/production-cnc` |
| `/production/cutting-machining/production-cnc/production-cnc-contour` | `/production/production-cnc/production-cnc-contour` |
| `/production/cutting-machining/production-cnc/production-cnc-combined` | `/production/production-cnc/production-cnc-combined` |
| `/production/edge-finishing` | `/production` |
| `/production/edge-finishing/production-grinding` | `/production/production-grinding` |
| `/production/edge-finishing/production-grinding/production-edge-arrising` | `/production/production-arrising/production-edge-arrising` |
| `/production/edge-finishing/production-grinding/production-edge-ground-straight` | `/production/production-grinding/production-edge-ground-straight` |
| `/production/edge-finishing/production-grinding/production-edge-ground-curved` | `/production/production-grinding/production-edge-ground-curved` |
| `/production/edge-finishing/production-polishing` | `/production/production-polishing` |
| `/production/edge-finishing/production-polishing/production-edge-polished-straight` | `/production/production-polishing/production-edge-polished-straight` |
| `/production/edge-finishing/production-polishing/production-edge-polished-curved` | `/production/production-polishing/production-edge-polished-curved` |
| `/production/edge-finishing/production-bevel` | `/production/production-bevel` |
| `/production/edge-finishing/production-bevel/production-bevel-straight` | `/production/production-bevel/production-bevel-straight-widths/production-bevel-straight` |
| `/production/edge-finishing/production-bevel/production-bevel-curved` | `/production/production-bevel/production-bevel-curved-widths/production-bevel-curved` |
| `/production/edge-finishing/production-edge-mitre` | `/production/production-mitre/production-edge-mitre` |
| `/production/thermal-forming` | `/production` |
| `/production/thermal-forming/production-tempering` | `/production/production-tempering` |
| `/production/thermal-forming/production-tempering/production-tempering-flat` | `/production/production-tempering/production-tempering-flat` |
| `/production/thermal-forming/production-tempering/production-tempering-curved` | `/production/production-bending-tempering/production-tempering-curved` |
| `/production/thermal-forming/production-bending` | `/production/production-bending` |
| `/production/thermal-forming/production-bending/production-bending-radius` | `/production/production-bending/production-bending-radius` |
| `/production/thermal-forming/production-bending/production-bending-shaped` | `/production/production-bending/production-bending-shaped` |
| `/production/lamination` | `/production` |
| `/production/lamination/production-lamination-base` | `/production/production-lamination/production-lamination-base` |
| `/production/lamination/production-lamination-base/production-lamination-clear` | `/production/production-lamination/production-lamination-base/production-lamination-clear` |
| `/production/lamination/production-lamination-base/production-lamination-tempered` | `/production/production-lamination/production-lamination-base/production-lamination-tempered` |
| `/production/lamination/production-lamination-base/production-lamination-tinted` | `/production/production-lamination/production-lamination-base/production-lamination-tinted` |
| `/production/lamination/production-lamination-colour` | `/production/production-lamination/production-lamination-colour` |
| `/production/lamination/production-lamination-colour/production-lamination-matte` | `/production/production-lamination/production-lamination-colour/production-lamination-matte` |
| `/production/lamination/production-lamination-colour/production-lamination-coloured` | `/production/production-lamination/production-lamination-colour/production-lamination-coloured` |
| `/production/lamination/production-lamination-decor` | `/production/production-lamination/production-lamination-decor` |
| `/production/lamination/production-lamination-decor/production-lamination-textile` | `/production/production-lamination/production-lamination-decor/production-lamination-textile` |
| `/production/lamination/production-lamination-decor/production-lamination-mesh` | `/production/production-lamination/production-lamination-decor/production-lamination-mesh` |
| `/production/lamination/production-lamination-decor/production-lamination-image` | `/production/production-lamination/production-lamination-decor/production-lamination-image` |
| `/production/surface-decoration` | `/production` |
| `/production/surface-decoration/production-sandblast` | `/production/production-sandblast` |
| `/production/surface-decoration/production-sandblast/production-sandblast-full` | `/production/production-sandblast/production-sandblast-full` |
| `/production/surface-decoration/production-sandblast/production-sandblast-pattern` | `/production/production-sandblast/production-sandblast-pattern` |
| `/production/surface-decoration/production-sandblast/production-sandblast-mirror-light` | `/production/production-mirror-light/production-sandblast-mirror-light` |
| `/production/surface-decoration/production-engraving` | `/production` |
| `/production/surface-decoration/production-engraving/production-engraving-mechanical` | `/production/production-mechanical-engraving/production-engraving-mechanical` |
| `/production/surface-decoration/production-engraving/production-engraving-laser` | `/production/production-laser-engraving/production-engraving-laser` |
| `/production/surface-decoration/production-painting` | `/production/production-painting` |
| `/production/surface-decoration/production-painting/production-painting-lacquer` | `/production/production-painting/production-painting-lacquer` |
| `/production/surface-decoration/production-painting/production-painting-enamel` | `/production/production-enamelling/production-painting-enamel` |
| `/production/surface-decoration/production-printing` | `/production` |
| `/production/surface-decoration/production-printing/production-printing-uv` | `/production/production-uv-printing/production-printing-uv` |
| `/production/surface-decoration/production-printing/production-printing-ceramic` | `/production/production-ceramic-printing/production-printing-ceramic` |
| `/production/surface-decoration/production-printing/production-printing-screen` | `/production/production-screen-printing/production-printing-screen` |
| `/production/surface-decoration/production-films` | `/production/production-films` |
| `/production/surface-decoration/production-films/production-film-matte` | `/production/production-films/production-film-matte` |
| `/production/surface-decoration/production-films/production-film-tinted` | `/production/production-films/production-film-tinted` |
| `/production/surface-decoration/production-films/production-film-graphics` | `/production/production-films/production-film-graphics` |
| `/production/bonding` | `/production` |
| `/production/bonding/production-bonding-edge` | `/production/production-bonding/production-bonding-edge` |
| `/production/bonding/production-bonding-face` | `/production/production-bonding/production-bonding-face` |
| `/production/bonding/production-bonding-metal` | `/production/production-bonding/production-bonding-metal` |

## Источники и границы

Базовая доказательная база и условия обработки сохранены в `docs/production-research.md`. Его прежние числа 6 / 70 / 46 описывают исходную редакцию; текущие числа приведены в этом документе.

Дополнительно проверены первичные страницы:

- https://steklogress.ru/obrabotka-stekla/obrabotka-kromki-stekla-fatset/ — различает шлифовку, полировку, фацет и прямую/криволинейную геометрию; retrieval ref `turn100view0`.
- https://meksteklo.ru/services/obrabotka-stekla/fatset/ — таблица включает ширины 5, 10, 15, 20, 25–30, 35, 40 мм для двух геометрий; retrieval ref `turn102view0`. Объединённая позиция 25–30 раскрыта на два выбираемых значения 25 и 30 мм; отдельные значения также показаны в официальном PDF-прайсе. Цены не перенесены. В описательном тексте этой страницы есть сомнительное требование толщины «больше 4 см»; оно не использовано, как и численные углы.
- https://meksteklo.ru/info/price/price_meksteklo.pdf — первичный перечень отличает резку и обработку триплекса, прорезь в отверстиях, закругление углов, вырезы под петлю, коннектор, фитинги и розетку, плёнку на зеркало; retrieval ref `turn101search8`. Численные технологические пределы, цены, сроки и производственные возможности компании не перенесены.

Каталог описывает состав задания. Он не заявляет наличие собственного оборудования, складские остатки, сертификаты, несущую способность, классы защиты или готовность любого выбранного сочетания к изготовлению. Бесцветная прозрачная основа — CrystalVision. Намеренная тонировка, декор и прослойки остаются отдельными свойствами.

## Выполненная проверка

Импорт ES-модуля выполнен успешно. Проверены уникальность ID и путей, наличие всех 46 прежних конечных ID, 70 корректных целей aliases, наличие всех корневых ID из productionServiceGroups, result и четыре входных пункта brief у всех 98 конечных вариантов, две notes и связи materialIds. Проверка формы точной ширины, видимых входов и опубликованных HTML относится к интеграции интерфейса.
