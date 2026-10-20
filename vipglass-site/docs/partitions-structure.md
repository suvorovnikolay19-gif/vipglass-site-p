# Структура каталога перегородок

Дата: 16.10.2026. Исходная версия: v6, commit 191375c3. Реализация: dist/partitions-tree.mjs. Интеграция маршрутов, UI и изображений выполняется отдельно.

## Итог

458 узлов, 309 конечных страниц. Это 212 контекстных компоновок и 97 явно помеченных вариантов комплектации. Число страниц не означает число независимых инженерных систем или наличие складских изделий. Все узлы имеют status=structure.

| Система | Узлов | Конечных страниц | Компоновок | Вариантов комплектации |
| --- | ---: | ---: | ---: | ---: |
| Цельностеклянные перегородки | 122 | 82 | 60 | 22 |
| Каркасные стеклянные перегородки | 147 | 97 | 68 | 29 |
| Лофт-перегородки со стеклом | 147 | 99 | 66 | 33 |
| SMART-перегородки | 41 | 31 | 18 | 13 |

Корень partitions содержит ровно четыре дочерних узла: all-glass, framed, loft, smart. Первые три — основные конструктивные входы; SMART — отдельный функциональный вход. Главный узел добавляет ещё одну страницу к сумме узлов систем.

## Навигация

- Цельностеклянные: пространство → группа конструкций → конкретная схема. Отдельные ветви посвящены трансформации, стеклу, декору и креплению.
- Каркасные: одинарное / двойное / двойное на зажимном профиле → пространство → состав и движение → конечная схема. Стекло и жалюзи имеют отдельные подробные каталоги.
- Лофт: пространство → движение → состав. Опирание раздвижных секций, особая геометрия, стекло, материал рамы, рисунок раскладки и покрытие вынесены в различимые ветви. Во всех композициях есть стекло.
- SMART: пространство, конструкция, управление, группы целых панелей, основа триплекса, сегментация внутри панели. Все варианты имеют внутренний переключаемый слой.

Глубина до конечной страницы достигает шести уровней после /catalog. Нет искусственных ветвей с единственным ребёнком. Родственные разновидности должны отображаться карточками в directory; нельзя заменять дерево плоским перечнем всех страниц.

Списки комбинаций заданы редакционно: например, маятниковые входы предусмотрены в офисном и торговом сценарии, пеналы — в рамных домашних композициях; двойное остекление не присваивается всем лофт-механизмам. В коде нет декартова произведения помещения, цвета, толщины и механизма. Повторение схемы в разных пространствах описывает применение; оно не выдаётся за новую инженерную систему.

## Контракт данных

Экспорты: partitionsTree и partitionsPathAliases. В каждом потомке явно заданы systemId и imageKey. Лист: kind=solution, status=structure, существующий solutionId, modelKind и preset. Используются только пять исходных баз: partition-home-clear, partition-office-clear, partition-home-framed, partition-office-framed, partition-home-sliding. Назначение и открывание задаёт preset, а не название исходной базы.

| Поле | Значения / назначение |
| --- | --- |
| modelKind | configuration; glass-option; decor-option; privacy-option |
| systemId | all-glass; framed; loft; smart |
| applicationId | home; office; meeting; retail; mall; cafe; wardrobe; kitchen; living; studio; consulting; hotel; medical; project |
| openingId | fixed; swing; pendulum; sliding; telescopic; folding; stacking; pivot; project |
| glazingId | single; double; project |
| glassTreatmentId | project; tempered; annealed; laminated; laminated-tempered |
| materialColorId | clear; grey; bronze |
| blindsId | none; external; between-panes; project |
| decorId | none/project либо конкретная обработка, рисунок, фактура или сегментация |
| thicknessMm | Число только в карточках запроса определённой толщины; иначе пустая строка |
| thicknessRequestOnly | true во всех листьях; число не является автоматическим разрешением системы |
| thickness | Читаемая толщина или пояснение о проектном составе |
| smartTechnologyId / smartConstruction | Только laminated-pdlc / laminated |
| supportingSystemId | Для SMART: выбранная цельностеклянная, профильная или лофт-опора |
| controlZonesId | together; independent; groups — управление целыми панелями или их группами |
| segmentationId | horizontal; vertical; zones — области внутри переключаемого слоя одной панели |
| profileColorId | Цвет покрытия рамы; не меняет materialColorId стекла |

Каждый лист содержит читаемые system, application, opening, configuration, glass, materialColor, glassTreatment, thickness, glazing, blinds, decor. У вариантов материала и оформления незаданные glazing/blinds/decor используют project, а не скрыто выбирают один ряд стекла и отсутствие жалюзи. Project — неизвестное до выбора конструкции значение, не wildcard строгого фильтра.

Числовые толщины: цельностеклянное закалённое 8/10/12 мм; каркасное незакалённое неподвижное 5/6 мм, каркасное закалённое 5/6/8/10/12 мм; лофт закалённое 6/8/10 мм. Это заявки на проверку применимости. Есть индивидуальный запрос. Неподтверждённые страницы 3 мм и универсальное назначение 4 мм не созданы. Незакалённое, включая индивидуальный запрос, ограничено неподвижным стеклом в удерживающей раме. Для триплекса задают состав слоёв, а не одиночную толщину листа по умолчанию.

Изображения: partition-clear, partition-framed, partition-loft, partition-double-blinds, partition-smart, partition-shop. Это иллюстрации семейства; изображение не должно выдаваться за точный чертёж каждого состава.

## Технические границы

Двойное остекление — два независимых ряда стекла. Состав дверного узла указан как отдельное согласование. Нет герметичных стеклопакетов, автоматических акустических классов, огнестойкости, предельных размеров, чужих сертификатов или численных обещаний. Триплекс не считается двойным остеклением профильной рамы. Жалюзи при одном ряду навесные; при двух рядах — межрамные.

Бесцветная прозрачная основа — Crystal Vision. Серое и бронзовое стекло названы отдельно. Заводскому рифлёному стеклу бренд Crystal Vision автоматически не присваивается: основа и бесцветность проверяются по образцу. Матирование не обозначает закалку, а покрытие под металл не означает профиль из этого металла.

SMART: только слой внутри многослойного стекла. Поверхностная PDLC-плёнка, наклейка на существующее стекло и модернизация старой перегородки отсутствуют в предложении. Для смешанного решения с обычной дверью заданы smartScope, fixedGlass, doorGlass, doorGlassTreatment. Подвижные SMART-полотна имеют отдельное условие передачи питания. Прозрачное состояние может иметь остаточную дымку, матовое рассеивает свет и не означает blackout. Питание, контроллер и состояние без питания согласуются с системой.

Межпанельное управление и сегментация внутри листа разделены. Сенсор, кнопка, пульт и автоматизация — отдельные пожелания к совместимому контроллеру. Медицинский кабинет и гостиница обозначены проектными сценариями, без санитарных свойств и универсальной пригодности к условиям эксплуатации.

## Основание редакционной структуры

Подробные первичные источники и ограничения: docs/partitions-research-a.md, docs/partitions-research-b.md, docs/partitions-research-c.md, docs/smart-research-a.md и docs/smart-research-c.md. Проверка источников выполнена исследовательскими агентами. Настоящий модуль — редакционная компоновка подтверждённых типов, не перенос ассортимента поставщика.

Ключевые ссылки:

- https://ntglass.ru/catalog/peregorodki/statsionarnye-peregorodki-s-odinarnym-ostekleniem/ — один ряд стекла.
- https://ntglass.ru/catalog/peregorodki/statsionarnye-peregorodki-s-dvoynym-ostekleniem/ — два ряда.
- https://ntglass.ru/catalog/peregorodki/statsionarnye-peregorodki-na-zazhimnom-profile-s-dvoynym-ostekleniem/ — отдельная зажимная система.
- https://ntglass.ru/services/dekorirovanie/peregorodki-s-zhalyuzi/ — межрамные жалюзи.
- https://glassnoff.ru/catalog/product/steklyannaya-peregorodka-s-odinarnym-steklom-i-zhalyuzi/ — один ряд и отдельные жалюзи.
- https://disaglass.ru/steklyannye-peregorodki/karkasnye — рамное стекло, составы и толщины в контексте систем.
- https://steklomet.ru/catalog/glass-partitions/sliding/ — реальные схемы отведения дверей.
- https://loft-system.ru/razdvizhnye-steklyannye-peregorodki/ — верхняя/нижняя опора.
- https://loft-system.ru/kaskadnye-peregorodki/ и https://loft-system.ru/skladnye-steklyannye-peregorodki/ — различие каскада и складывания.
- https://www.glasstroy.ru/loft — стеклянные рамные композиции и раскладка.
- https://privateglass.ru/catalog/smart-peregorodki/peregorodki-razdvizhnye/ — SMART-механика с условием совместимого питания.
- https://privateglass.ru/company/articles/587/ — органы управления и зоны.
- https://privateglass.ru/catalog/smart_steklo/smart-steklo-elektronnoe-zhalyuzi/ — сегменты внутри панели.
- https://www.gauzy.com/smart-glass-faq-technicalinfo/ — оптические ограничения и согласование системы; технический источник, не заявленный поставщик.

## Сохранение адресов

Покрыты все 46 исходных v6 узлов и два прежних коротких пути /catalog/partitions/home, /catalog/partitions/office. Всего 48 записей aliases, включая корень. Все цели существуют. Широкие домашняя/офисная страницы, смешивавшие системы, ведут на общий каталог; старые конкретные схемы сохраняют конструкцию, место и механизм. Переговорные получили более точное applicationId=meeting вместо общего office. Старые каркасные страницы без признака двойного остекления сопоставлены с одинарной системой, соответствующей прежней простой рамной композиции.

| Старый путь после /catalog/partitions | Канонический путь после /catalog/partitions |
| --- | --- |
| / | / |
| /partitions-home | / |
| /partitions-office | / |
| /home | / |
| /office | / |
| /partitions-home/partitions-home-clear | /all-glass/home/fixed |
| /partitions-home/partitions-home-clear/partitions-home-clear-straight | /all-glass/home/fixed/line |
| /partitions-home/partitions-home-clear/partitions-home-clear-corner | /all-glass/home/fixed/corner |
| /partitions-home/partitions-home-frame | /framed/single/home |
| /partitions-home/partitions-home-frame/partitions-home-frame-fixed | /framed/single/home/fixed |
| /partitions-home/partitions-home-frame/partitions-home-frame-fixed/partitions-home-frame-fixed-straight | /framed/single/home/fixed/line |
| /partitions-home/partitions-home-frame/partitions-home-frame-fixed/partitions-home-frame-fixed-corner | /framed/single/home/fixed/corner |
| /partitions-home/partitions-home-frame/partitions-home-frame-door | /framed/single/home |
| /partitions-home/partitions-home-sliding | /all-glass/home/sliding |
| /partitions-home/partitions-home-sliding/partitions-home-sliding-single | /all-glass/home/sliding/slide |
| /partitions-home/partitions-home-sliding/partitions-home-sliding-multiple | /all-glass/home/sliding |
| /partitions-home/partitions-home-sliding/partitions-home-sliding-multiple/partitions-home-sliding-multiple-opposed-pair | /all-glass/home/sliding/slide-pair |
| /partitions-home/partitions-home-sliding/partitions-home-sliding-multiple/partitions-home-sliding-multiple-telescopic | /all-glass/home/sliding/telescopic |
| /partitions-office/partitions-office-clear | /all-glass/office |
| /partitions-office/partitions-office-clear/partitions-office-clear-meeting | /all-glass/meeting |
| /partitions-office/partitions-office-clear/partitions-office-clear-zones | /all-glass/office/fixed |
| /partitions-office/partitions-office-clear/partitions-office-clear-zones/partitions-office-clear-zones-line | /all-glass/office/fixed/line |
| /partitions-office/partitions-office-clear/partitions-office-clear-zones/partitions-office-clear-zones-corner | /all-glass/office/fixed/corner |
| /partitions-office/partitions-office-frame | /framed/single/office |
| /partitions-office/partitions-office-frame/partitions-office-frame-meeting | /framed/single/meeting |
| /partitions-office/partitions-office-frame/partitions-office-frame-zones | /framed/single/office |
| /partitions-office/partitions-office-frame/partitions-office-frame-zones/partitions-office-frame-zones-fixed | /framed/single/office/fixed/line |
| /partitions-office/partitions-office-frame/partitions-office-frame-zones/partitions-office-frame-zones-entry | /framed/single/office/entry |
| /partitions-office/partitions-office-frame/partitions-office-frame-zones/partitions-office-frame-zones-entry/partitions-office-frame-zones-entry-swing-single | /framed/single/office/entry/single |
| /partitions-office/partitions-office-frame/partitions-office-frame-zones/partitions-office-frame-zones-entry/partitions-office-frame-zones-entry-sliding-single | /framed/single/office/entry/slide |
| /partitions-home/partitions-home-frame/partitions-home-frame-door/partitions-home-frame-door-single | /framed/single/home/single-door |
| /partitions-home/partitions-home-frame/partitions-home-frame-door/partitions-home-frame-door-single/partitions-home-frame-door-single-swing-single | /framed/single/home/single-door/single |
| /partitions-home/partitions-home-frame/partitions-home-frame-door/partitions-home-frame-door-single/partitions-home-frame-door-single-sliding-single | /framed/single/home/single-door/slide |
| /partitions-home/partitions-home-frame/partitions-home-frame-door/partitions-home-frame-door-pair | /framed/single/home/pair-door |
| /partitions-home/partitions-home-frame/partitions-home-frame-door/partitions-home-frame-door-pair/partitions-home-frame-door-pair-swing-pair | /framed/single/home/pair-door/pair |
| /partitions-home/partitions-home-frame/partitions-home-frame-door/partitions-home-frame-door-pair/partitions-home-frame-door-pair-sliding-pair | /framed/single/home/pair-door/slide-pair |
| /partitions-office/partitions-office-clear/partitions-office-clear-meeting/partitions-office-clear-meeting-wall | /all-glass/meeting/straight |
| /partitions-office/partitions-office-clear/partitions-office-clear-meeting/partitions-office-clear-meeting-wall/partitions-office-clear-meeting-wall-swing-single | /all-glass/meeting/straight/single |
| /partitions-office/partitions-office-clear/partitions-office-clear-meeting/partitions-office-clear-meeting-wall/partitions-office-clear-meeting-wall-sliding-single | /all-glass/meeting/straight/slide |
| /partitions-office/partitions-office-clear/partitions-office-clear-meeting/partitions-office-clear-meeting-corner | /all-glass/meeting/corner |
| /partitions-office/partitions-office-clear/partitions-office-clear-meeting/partitions-office-clear-meeting-corner/partitions-office-clear-meeting-corner-swing-single | /all-glass/meeting/corner/corner-swing |
| /partitions-office/partitions-office-clear/partitions-office-clear-meeting/partitions-office-clear-meeting-corner/partitions-office-clear-meeting-corner-sliding-single | /all-glass/meeting/corner/corner-slide |
| /partitions-office/partitions-office-frame/partitions-office-frame-meeting/partitions-office-frame-meeting-wall | /framed/single/meeting/straight |
| /partitions-office/partitions-office-frame/partitions-office-frame-meeting/partitions-office-frame-meeting-wall/partitions-office-frame-meeting-wall-swing-single | /framed/single/meeting/straight/single |
| /partitions-office/partitions-office-frame/partitions-office-frame-meeting/partitions-office-frame-meeting-wall/partitions-office-frame-meeting-wall-sliding-single | /framed/single/meeting/straight/slide |
| /partitions-office/partitions-office-frame/partitions-office-frame-meeting/partitions-office-frame-meeting-corner | /framed/single/meeting/corner |
| /partitions-office/partitions-office-frame/partitions-office-frame-meeting/partitions-office-frame-meeting-corner/partitions-office-frame-meeting-corner-swing-single | /framed/single/meeting/corner/corner-swing |
| /partitions-office/partitions-office-frame/partitions-office-frame-meeting/partitions-office-frame-meeting-corner/partitions-office-frame-meeting-corner-sliding-single | /framed/single/meeting/corner/corner-slide |

## Проверка

- uniquePaths: PASS
- allAliasesExist: PASS
- allOldCovered: PASS
- allFields: PASS
- allSolutions: PASS
- noSingletons: PASS
- allStatusStructure: PASS
- allSmartInternal: PASS
- allThicknessRequests: PASS
- numericThickness: PASS

Проверены уникальность путей, отсутствие пустых/одноэлементных ветвей, существование solutionId, обязательные preset-поля, тип числовой толщины, SMART-технология и полное покрытие старых адресов. Отдельный интеграционный QA выполняет проверку каталога, фильтров и HTML-маршрутов.
