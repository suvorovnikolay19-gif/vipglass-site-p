import { showersTree as showers } from './showers-tree.mjs';
export { showersPathAliases } from './showers-tree.mjs';
import { partitionsTree } from './partitions-tree.mjs';
export { partitionsPathAliases } from './partitions-tree.mjs';

// Hierarchical made-to-order catalogue. These are solution families, not stocked SKUs.
// A confirmed status refers to the direction in the client's brief, not engineering approval.
// The three unfinished directions remain structure throughout their trees.

const GLASS = 'Осветлённое стекло Crystal Vision без зелёного оттенка';

function branch(id, title, intro, children, status = 'structure', selectionHint) {
  return { id, title, intro, status, ...(selectionHint ? { selectionHint } : {}), children };
}

function leaf(id, title, intro, solutionId, preset = {}, status = 'structure') {
  const labels = {
    application: 'Назначение', mounting: 'Крепление', opening: 'Открывание',
    geometry: 'Геометрия', configuration: 'Композиция', handrail: 'Поручень',
    sections: 'Секции', shape: 'Форма', deliverySet: 'Состав заказа',
  };
  const details = Object.entries(labels)
    .filter(([key]) => preset[key])
    .map(([key, label]) => `${label}: ${preset[key]}`);
  return {
    id, title, intro, kind: 'solution', solutionId, status,
    preset: {
      mode: 'installation', glass: GLASS, ...preset, title,
      note: [preset.note, ...details, `Прозрачное стекло: ${GLASS}.`].filter(Boolean).join('\n'),
    },
  };
}

function variants(id, title, intro, solutionId, choices, common = {}, status = 'structure') {
  return branch(id, title, intro, choices.map(choice => leaf(
    `${id}-${choice.id}`, choice.title, choice.intro, solutionId,
    { ...common, ...choice.preset }, choice.status || status,
  )), status, 'Выберите композицию. Размеры и детали задаются в карточке решения.');
}

const doors = branch('doors', 'Стеклянные двери',
  'Отдельные дверные решения. Выберите способ открывания, количество полотен и композицию вокруг проёма. Наполнение предварительное.', [
    branch('doors-swing', 'Распашные стеклянные двери',
      'Полотна открываются поворотом. Выберите одну створку или парную дверь.', [
        variants('doors-swing-single', 'Одностворчатые распашные',
          'Одна дверь в готовом проёме или рядом с неподвижным стеклянным полотном.', 'door-swing-single', [
            { id: 'opening', title: 'Одна распашная дверь в проёме', intro: 'Самостоятельная стеклянная створка без бокового остекления.', preset: { configuration: 'Одна створка в проёме' } },
            { id: 'side-glass', title: 'Распашная дверь с боковым стеклом', intro: 'Одна створка включена в композицию с неподвижной стеклянной панелью.', preset: { configuration: 'Одна створка и боковое неподвижное стекло' } },
          ], { application: 'Одно полотно', opening: 'Распашное' }),
        branch('doors-swing-pair', 'Двустворчатые распашные',
          'Выберите соотношение двух створок, затем состав остекления вокруг двери.', [
            variants('doors-swing-pair-equal', 'Равные створки',
              'Две створки одинаковой ширины образуют симметричную композицию.', 'door-swing-pair', [
                { id: 'opening', title: 'Равная парная дверь в проёме', intro: 'Два равных полотна заполняют самостоятельный дверной проём.', preset: { configuration: 'Две равные створки в проёме' } },
                { id: 'side-glass', title: 'Равная парная дверь с боковым стеклом', intro: 'Симметричная дверь сочетается с неподвижными стеклянными секциями.', preset: { configuration: 'Две равные створки и боковое остекление' } },
              ], { application: 'Два полотна', opening: 'Распашное' }),
            variants('doors-swing-pair-unequal', 'Створки разной ширины',
              'Размеры и соотношение двух полотен задаются конкретным проёмом.', 'door-swing-pair', [
                { id: 'opening', title: 'Неравная парная дверь в проёме', intro: 'Основная и дополнительная створки имеют разную ширину.', preset: { configuration: 'Две неравные створки в проёме' } },
                { id: 'side-glass', title: 'Неравная парная дверь с боковым стеклом', intro: 'Две створки разной ширины входят в композицию с неподвижным остеклением.', preset: { configuration: 'Две неравные створки и боковое остекление' } },
              ], { application: 'Два полотна', opening: 'Распашное' }),
          ]),
      ]),
    branch('doors-sliding', 'Раздвижные стеклянные двери',
      'Полотна перемещаются вдоль проёма. Выберите одно или два дверных полотна.', [
        variants('doors-sliding-single', 'Однопольные раздвижные',
          'Одна створка может перемещаться вдоль стены или неподвижного стекла; место для перемещения проверяется по плану.', 'door-sliding-single', [
            { id: 'wall', title: 'Раздвижная дверь вдоль стены', intro: 'Одна стеклянная створка перемещается перед участком стены.', preset: { configuration: 'Одна створка со сдвигом вдоль стены' } },
            { id: 'glass', title: 'Раздвижная дверь вдоль стекла', intro: 'Одна створка перемещается параллельно неподвижной стеклянной секции.', preset: { configuration: 'Одна створка со сдвигом вдоль неподвижного стекла' } },
          ], { application: 'Одно полотно', opening: 'Раздвижное' }),
        variants('doors-sliding-pair', 'Двупольные раздвижные',
          'Два полотна образуют парную композицию. Выберите самостоятельный проём или сочетание с боковым остеклением.', 'door-sliding-pair', [
            { id: 'opening', title: 'Парная раздвижная дверь в проёме', intro: 'Две створки раздвигаются в противоположные стороны; схема креплений определяется проектом.', preset: { configuration: 'Две встречные створки в проёме' } },
            { id: 'side-glass', title: 'Парная раздвижная дверь с боковым стеклом', intro: 'Две подвижные створки работают в композиции с неподвижными боковыми секциями.', preset: { configuration: 'Две подвижные створки и боковое остекление' } },
          ], { application: 'Два полотна', opening: 'Раздвижное' }),
      ]),
  ], 'structure', 'Открывание → количество полотен → композиция → карточка решения.');

function railingMount(location, mount) {
  const id = `stairs-railings-${location.id}-${mount.id}`;
  const common = { application: location.application, mounting: mount.title, geometry: 'По контуру объекта' };
  const solutionId = location.solutionIds?.[mount.id] || location.solutionId;
  return branch(id, mount.title,
    `${location.intro} Крепление: ${mount.description} Затем выберите решение с поручнем или вариант для проверки без него.`, [
      variants(`${id}-with-handrail`, 'С поручнем',
        'Поручень входит в состав ограждения со стеклом. Материал поручня выбирается отдельно от крепления полотен.', solutionId, [
          { id: 'metal', title: `${location.leafTitle} — металлический поручень`, intro: `${location.intro} Стекло и металлический поручень входят в единое решение.`, preset: { handrail: 'Металлический' } },
          { id: 'wood', title: `${location.leafTitle} — деревянный поручень`, intro: `${location.intro} Деревянный поручень согласовывается по форме и отделке.`, preset: { handrail: 'Деревянный' } },
        ], common, 'confirmed'),
      leaf(`${id}-without-handrail`, `${location.leafTitle} — вариант без поручня`,
        'Композиция без видимого поручня рассматривается индивидуально. Возможность такого исполнения определяется для конкретного проекта.',
        solutionId, { ...common, handrail: 'Без поручня — только после подтверждения применимости' }, 'structure'),
    ], 'confirmed', 'Выберите наличие и материал поручня. Самостоятельные перила без стекла не предлагаются.');
}

const pointMount = { id: 'points', title: 'Точечное крепление', description: 'локальные крепления, в том числе к торцу основания.' };
const profileMount = { id: 'profile', title: 'Зажимной профиль', description: 'опорный профиль вдоль основания стеклянных полотен.' };
const postMount = { id: 'posts', title: 'Стойки со стеклом', description: 'стойки со стеклянным заполнением между ними.' };
const miniMount = { id: 'mini-posts', title: 'Мини-стойки', description: 'короткие опорные стойки со стеклянным заполнением.' };
const railingLocations = [
  { id: 'stair-flight', title: 'Ограждения лестниц', application: 'Ограждение лестницы', leafTitle: 'Ограждение лестницы', intro: 'Стеклянное ограждение повторяет линию лестничного марша и площадок.', mounts: [pointMount, profileMount, postMount], solutionIds: { points: 'railing-stairs-points', profile: 'railing-stairs-profile', posts: 'railing-stairs-posts' } },
  { id: 'second-light', title: 'Ограждения второго света', application: 'Второй свет', leafTitle: 'Ограждение второго света', intro: 'Стекло обозначает открытый край перекрытия между уровнями пространства.', mounts: [pointMount, profileMount, postMount], solutionId: 'railing-second-light' },
  { id: 'mezzanine', title: 'Ограждения антресолей и площадок', application: 'Антресоль', leafTitle: 'Ограждение антресоли', intro: 'Стеклянная граница антресоли, внутренней галереи или площадки.', mounts: [pointMount, profileMount, postMount], solutionId: 'railing-mezzanine' },
  { id: 'outdoor', title: 'Ограждения балконов и террас', application: 'Балкон и терраса', leafTitle: 'Ограждение балкона или террасы', intro: 'Стеклянное ограждение наружного пространства; состав конструкции определяется по условиям объекта.', mounts: [profileMount, miniMount], solutionId: 'railing-outdoor' },
];

const stairs = branch('stairs', 'Стеклянные лестницы и ограждения',
  'Три самостоятельные задачи: изготовить лестницу целиком, добавить стеклянное ограждение или заказать стеклянные ступени. Стекло обязательно входит в изделие.', [
    branch('stairs-complete', 'Лестницы целиком',
      'Изготовление общей лестничной конструкции со стеклом. Для этого направления предусмотрена работа с металлокаркасом.', [
        variants('stairs-complete-metal-rail', 'Металлокаркас со стеклянным ограждением',
          'Металлическая несущая часть и стеклянное ограждение проектируются как единая лестница.', 'stairs-metal-glass-railing', [
            { id: 'straight', title: 'Прямая лестница на металлокаркасе со стеклом', intro: 'Один прямой марш и стеклянное ограждение в составе общего заказа.', preset: { geometry: 'Прямая лестница', configuration: 'Металлокаркас и стеклянное ограждение' } },
            { id: 'turning', title: 'Поворотная лестница на металлокаркасе со стеклом', intro: 'Лестница с изменением направления; устройство поворота и ограждения определяется планировкой.', preset: { geometry: 'Поворотная лестница', configuration: 'Металлокаркас и стеклянное ограждение' } },
          ], { application: 'Лестница целиком', mounting: 'По проекту' }, 'confirmed'),
        variants('stairs-complete-metal-steps', 'Металлокаркас со стеклянными ступенями',
          'Стеклянные ступени входят в состав лестницы с металлической несущей частью.', 'stairs-metal-glass-steps', [
            { id: 'straight', title: 'Прямой марш со стеклянными ступенями', intro: 'Металлическое основание и стеклянные ступени для прямого лестничного марша.', preset: { geometry: 'Прямой марш', configuration: 'Металлокаркас и стеклянные ступени' } },
            { id: 'turning', title: 'Поворотная лестница со стеклянными ступенями', intro: 'Ступени и поворотная часть формируются по общей геометрии лестницы.', preset: { geometry: 'Поворотная лестница', configuration: 'Металлокаркас и стеклянные ступени' } },
          ], { application: 'Лестница целиком', mounting: 'По проекту' }, 'confirmed'),
        variants('stairs-complete-floating', 'Парящие лестничные композиции',
          'Визуально лёгкая лестница со стеклом. Несущие узлы и их возможность определяются после изучения основания.', 'stairs-floating-glass', [
            { id: 'glass-rail', title: 'Парящая лестница со стеклянным ограждением', intro: 'Лёгкая композиция ступеней дополняется прозрачным стеклянным ограждением.', preset: { configuration: 'Парящая лестница со стеклянным ограждением', geometry: 'По планировке' } },
            { id: 'glass-steps', title: 'Парящая композиция со стеклянными ступенями', intro: 'Стеклянные ступени участвуют в образе лестницы; конструктивная схема разрабатывается под объект.', preset: { configuration: 'Парящая композиция со стеклянными ступенями', geometry: 'По планировке' } },
          ], { application: 'Лестница целиком', mounting: 'По проекту' }, 'confirmed'),
      ], 'confirmed'),
    branch('stairs-railings', 'Стеклянные ограждения',
      'Начните с места установки. Для каждого места отдельно выбираются крепление и поручень.',
      railingLocations.map(location => branch(`stairs-railings-${location.id}`, location.title,
        location.intro, location.mounts.map(mount => railingMount(location, mount)), 'confirmed',
        'Крепление → поручень → конечное решение для вашего проекта.')),
      'confirmed'),
    branch('stairs-glass-steps', 'Стеклянные ступени по ТЗ',
      'Изготовление отдельных стеклянных деталей для лестничного проекта заказчика. Состав стекла, обработка и узлы задаются согласованным чертежом.', [
        variants('stairs-glass-steps-individual', 'Отдельные ступени',
          'Выберите обычную прямоугольную деталь или ступень с индивидуальным контуром.', 'stairs-glass-steps-parts', [
            { id: 'rectangular', title: 'Прямоугольная стеклянная ступень', intro: 'Отдельная ступень с прямоугольным контуром по согласованным размерам и узлам.', preset: { shape: 'Прямоугольная', deliverySet: 'Отдельная ступень' } },
            { id: 'shaped', title: 'Стеклянная ступень по индивидуальному контуру', intro: 'Форма детали повторяет контур, заданный рабочим чертежом лестницы.', preset: { shape: 'Индивидуальный контур по чертежу', deliverySet: 'Отдельная ступень' } },
          ], { application: 'Отдельные ступени', mode: 'parts', heightLabel: 'Глубина ступени' }, 'confirmed'),
        variants('stairs-glass-steps-sets', 'Комплекты ступеней',
          'Набор стеклянных деталей по общей спецификации лестничного проекта.', 'stairs-glass-steps-parts', [
            { id: 'straight', title: 'Комплект ступеней для прямого марша', intro: 'Комплект деталей для одного прямого марша с общей нумерацией по чертежу.', preset: { geometry: 'Прямой марш', deliverySet: 'Комплект ступеней' } },
            { id: 'turning', title: 'Комплект ступеней для поворотной лестницы', intro: 'Детали различной геометрии объединяются в комплект по спецификации заказчика.', preset: { geometry: 'Поворотная лестница', deliverySet: 'Комплект ступеней по спецификации' } },
          ], { application: 'Отдельные ступени', mode: 'parts', heightLabel: 'Глубина ступени' }, 'confirmed'),
      ], 'confirmed'),
  ], 'confirmed', 'Лестница целиком, отдельное ограждение и стеклянные ступени имеют разные маршруты выбора.');

function canopySystem(id, title, mounting, singleId, multipleId) {
  const common = { mounting, heightLabel: 'Вылет', widthLabel: 'Ширина вдоль фасада' };
  return branch(id, title,
    'Стеклянное покрытие крепится к зданию этой системой. Изготовление и возведение несущего металлокаркаса не предлагается.', [
      branch(`${id}-single`, 'Одна стеклянная секция',
        'Единая стеклянная плоскость. Выберите место относительно входа и контур детали.', [
          variants(`${id}-single-door`, 'Над отдельным входом',
            'Козырёк над одним дверным проёмом. Ширина и вылет задаются по месту.', singleId, [
              { id: 'rectangular', title: 'Прямоугольный козырёк над входом', intro: 'Одна прямоугольная стеклянная секция над самостоятельным входом.', preset: { shape: 'Прямоугольная', configuration: 'Одна секция над входом' } },
              { id: 'contour', title: 'Козырёк над входом по индивидуальному контуру', intro: 'Контур стекла рассматривается по архитектуре входа и чертежу; возможность формы проверяется вместе с креплением.', preset: { shape: 'Индивидуальный контур по чертежу', configuration: 'Одна секция над входом' }, status: 'structure' },
            ], { ...common, application: 'Над входом', sections: 'Одна секция' }, 'confirmed'),
          variants(`${id}-single-portal`, 'Над входным порталом',
            'Стеклянная плоскость согласуется с композицией портала и боковыми частями входа.', singleId, [
              { id: 'door-width', title: 'Козырёк по ширине дверного проёма', intro: 'Одна стеклянная секция соотносится с центральным дверным проёмом портала.', preset: { shape: 'Прямоугольная', configuration: 'По ширине дверного проёма' } },
              { id: 'portal-width', title: 'Козырёк по композиции входного портала', intro: 'Ширина стеклянной секции согласуется с порталом целиком; габариты определяются проектом.', preset: { shape: 'По геометрии портала', configuration: 'По общей композиции портала' } },
            ], { ...common, application: 'Входной портал', sections: 'Одна секция' }, 'confirmed'),
        ], 'confirmed'),
      branch(`${id}-multiple`, 'Несколько стеклянных секций',
        'Покрытие собирается из отдельных стеклянных плоскостей. Узлы между секциями и крепления определяются общим проектом.', [
          variants(`${id}-multiple-facade`, 'Вдоль фасада',
            'Несколько секций образуют линию покрытия, согласованную с фасадом.', multipleId, [
              { id: 'equal', title: 'Линия козырька из равных секций', intro: 'Повторяющиеся по ширине стеклянные секции образуют общую композицию.', preset: { configuration: 'Линейная композиция из равных секций' } },
              { id: 'varying', title: 'Линия козырька из секций разной ширины', intro: 'Ширина отдельных стеклянных деталей согласуется с членением фасада.', preset: { configuration: 'Линейная композиция из секций разной ширины' } },
            ], { ...common, application: 'Вдоль фасада', sections: 'Несколько секций' }, 'confirmed'),
          variants(`${id}-multiple-entries`, 'Над группой входов',
            'Выберите непрерывную композицию или отдельные стеклянные покрытия над соседними входами.', multipleId, [
              { id: 'continuous', title: 'Единая линия над несколькими входами', intro: 'Соседние секции образуют общую архитектурную линию покрытия.', preset: { configuration: 'Единая секционная линия над группой входов' } },
              { id: 'separate', title: 'Отдельные модули над группой входов', intro: 'Самостоятельные стеклянные секции располагаются над отдельными входами и согласуются по общему оформлению.', preset: { configuration: 'Раздельные модули над группой входов' } },
            ], { ...common, application: 'Группа входов', sections: 'Несколько секций' }, 'confirmed'),
        ], 'confirmed'),
    ], 'confirmed', 'Система → количество секций → расположение → конечное исполнение.');
}

const canopies = branch('canopies', 'Стеклянные козырьки и навесы',
  'Только стеклянные решения с креплением к зданию: тяги или зажимной профиль. Возведение металлокаркасов и остекление чужого готового каркаса не входят в предложение.', [
    canopySystem('canopies-rods', 'Козырьки на тягах', 'Тяги', 'canopy-rods', 'canopy-rods-sections'),
    canopySystem('canopies-profile', 'Козырьки на зажимном профиле', 'Зажимной профиль', 'canopy-clamp-profile', 'canopy-clamp-profile'),
  ], 'confirmed', 'Начните с системы крепления. Прозрачное стекло во всех ветвях — Crystal Vision.');

// A formerly broad solution keeps its URL as a choice page. Only its new
// children are orderable models; no old selection is redirected to a default.
function splitSolution(node, intro, choices, selectionHint = 'Выберите конкретное исполнение.') {
  const { title: oldTitle, note: oldNote, ...inherited } = node.preset || {};
  return branch(node.id, node.title, intro, choices.map(choice => leaf(
    `${node.id}-${choice.id}`, choice.title, choice.intro,
    choice.solutionId || node.solutionId, { ...inherited, ...choice.preset }, 'structure',
  )), node.status || 'structure', selectionHint);
}

function partitionDoorVariants(node) {
  const paired = node.id === 'partitions-home-frame-door-pair';
  const framed = /frame/.test(node.id);
  const geometry = node.preset.geometry || 'Прямая стеклянная перегородка';
  const fixed = framed ? 'Неподвижные стеклянные секции в каркасе' : 'Неподвижное цельностеклянное остекление';
  const support = framed ? 'Дверная система в составе каркаса' : 'Дверная система в составе цельностеклянного остекления';
  const specs = paired
    ? [{ id: 'swing-pair', label: 'Две распашные створки', opening: 'Распашное', count: 2 },
      { id: 'sliding-pair', label: 'Две встречные раздвижные створки', opening: 'Раздвижное', count: 2 }]
    : [{ id: 'swing-single', label: 'Одна распашная створка', opening: 'Распашное', count: 1 },
      { id: 'sliding-single', label: 'Одна раздвижная створка', opening: 'Раздвижное', count: 1 }];
  return splitSolution(node,
    'Неподвижная часть перегородки сохраняется, а дверной узел выбирается по способу открывания.',
    specs.map(spec => ({ id: spec.id, title: `${node.title} — ${spec.label.toLowerCase()}`,
      intro: spec.opening === 'Распашное'
        ? `${spec.count === 1 ? 'Створка поворачивается' : 'Две створки поворачиваются'} в дверном проёме; перед перегородкой требуется место для движения.`
        : `${spec.count === 1 ? 'Створка сдвигается' : 'Две створки расходятся'} вдоль соседнего остекления; зоны парковки задаются планировкой.`,
      preset: { geometry, opening: spec.opening, movingCount: spec.count,
        mounting: `${support}; ${spec.opening === 'Распашное' ? 'петельный узел' : 'направляющая и каретки'} по выбранной серии`,
        configuration: `${fixed} + ${spec.count === 1 ? '1 дверная створка' : '2 дверные створки'}`,
        note: 'Размер проёма, опоры двери и совместимость фурнитуры согласуются с системой неподвижного остекления.' },
    })), 'Распашная или раздвижная дверь в составе этой перегородки?');
}

function refineConstruction(node) {
  if (node.children) return { ...node, children: node.children.map(refineConstruction) };
  if (node.kind !== 'solution') return node;

  if (node.id.startsWith('partitions-') && node.preset.opening === 'Дверь по проекту') {
    return partitionDoorVariants(node);
  }
  if (node.id === 'partitions-home-sliding-single') {
    return { ...node, preset: { ...node.preset, opening: 'Раздвижное', movingCount: 1,
      geometry: 'Прямая перегородка', configuration: '1 подвижное стекло и неподвижное остекление по плану',
      mounting: 'Раздвижная направляющая и каретки для одной створки' } };
  }
  if (node.id === 'partitions-home-sliding-multiple') {
    return splitSolution(node,
      'Две встречные створки и телескопическая система по-разному освобождают проход и требуют разных зон парковки.', [
        { id: 'opposed-pair', title: 'Перегородка с двумя встречными раздвижными створками',
          intro: 'Две створки расходятся от центрального стыка в противоположные стороны.',
          preset: { opening: 'Раздвижное', geometry: 'Прямая перегородка', movingCount: 2,
            configuration: '2 встречные подвижные створки с неподвижными секциями по плану',
            mounting: 'Раздвижная система с двумя встречными полотнами',
            note: 'Место парковки проверяется с обеих сторон входа; габариты неподвижных секций задаются планом.' } },
        { id: 'telescopic', title: 'Перегородка с телескопическим открыванием',
          intro: 'Подвижные секции последовательно собираются в одну сторону по параллельным направляющим.',
          preset: { opening: 'Телескопическое раздвижное', geometry: 'Прямая перегородка',
            configuration: 'Несколько подвижных секций с телескопическим перемещением',
            mounting: 'Телескопическая система направляющих и кареток',
            note: 'Количество полотен, порядок движения и опоры фиксируются по документации выбранной телескопической системы.' } },
      ], 'Выберите встречное или телескопическое движение.');
  }

  const sideGlass = /^doors-swing-(?:single|pair-equal|pair-unequal)-side-glass$/.test(node.id)
    || node.id === 'doors-sliding-pair-side-glass' || node.id === 'doors-sliding-single-glass';
  if (sideGlass) {
    const pair = /pair/.test(node.id), sliding = /sliding/.test(node.id);
    const doorsCount = pair ? 2 : 1;
    return splitSolution(node,
      'Уточните число неподвижных боковых стекол: одно с одной стороны или два по обеим сторонам дверного проёма.',
      [1, 2].map(count => ({ id: count === 1 ? 'one-side' : 'two-sides',
        title: `${node.title} — ${count === 1 ? 'одна боковая панель' : 'две боковые панели'}`,
        intro: count === 1 ? 'Неподвижное стекло расположено с одной стороны дверного проёма.'
          : 'Дверная часть находится между двумя неподвижными боковыми стеклами.',
        preset: { geometry: 'Прямая дверная композиция', movingCount: doorsCount, fixedCount: count,
          configuration: `${doorsCount === 1 ? '1 дверная створка' : '2 дверные створки'} + ${count === 1 ? '1 боковая неподвижная панель' : '2 боковые неподвижные панели'}`,
          mounting: sliding ? 'Раздвижная направляющая; опоры по выбранной системе' : 'Петельный дверной узел; опора по выбранной системе',
          entryPosition: count === 1 ? 'Рядом с боковой панелью' : 'Между боковыми панелями',
          note: sliding ? 'Направление сдвига и место парковки каждой створки согласуются с боковым остеклением.'
            : 'Навеску створок, положение притвора и крепление боковых панелей согласуем как единую дверную систему.' },
      })), 'Одно или два неподвижных боковых стекла?');
  }

  if (['stairs-complete-metal-rail-turning', 'stairs-complete-metal-steps-turning', 'stairs-glass-steps-sets-turning'].includes(node.id)) {
    const parts = node.preset.mode === 'parts';
    return splitSolution(node,
      'Поворот через площадку и поворот забежными ступенями имеют разную геометрию и состав деталей.', [
        { id: 'landing', title: `${node.title} — поворот через площадку`,
          intro: 'Марши соединяются горизонтальной площадкой; поворот выполняется между маршами.',
          preset: { geometry: 'Поворотная лестница с площадкой', turningType: 'Через площадку',
            configuration: parts ? 'Комплект маршевых стеклянных ступеней; площадка по отдельной спецификации'
              : `${node.preset.configuration}; поворотная площадка между маршами`,
            note: 'Угол поворота, размеры площадки и опорные узлы определяются планом и согласованной конструкцией лестницы.' } },
        { id: 'winders', title: `${node.title} — забежные ступени`,
          intro: 'Направление меняется на ступенях с переменной шириной проступи, без промежуточной площадки.',
          preset: { geometry: 'Поворотная лестница с забежными ступенями', turningType: 'Забежные ступени',
            configuration: parts ? 'Комплект прямых и забежных стеклянных ступеней по спецификации'
              : `${node.preset.configuration}; забежная поворотная часть`,
            note: 'Контуры и опоры забежных деталей разрабатываются по общей геометрии лестницы; размеры берутся из согласованного чертежа.' } },
      ], 'Поворот через площадку или забежными ступенями?');
  }
  if (node.id.startsWith('stairs-railings-') && node.preset.mounting === 'Зажимной профиль') {
    return splitSolution(node,
      'Профиль располагается поверх основания либо крепится к его боковой несущей поверхности. Для этих узлов нужны разные серии профиля.', [
        { id: 'top-mount', title: `${node.title} — профиль поверх основания`,
          intro: 'Опорный профиль расположен на верхней поверхности площадки, перекрытия или лестничного основания.',
          preset: { mounting: 'Зажимной профиль поверх основания', mountingPosition: 'Верхнее крепление',
            configuration: `Стеклянное ограждение в верхнем опорном профиле; ${node.preset.handrail.toLowerCase()}`,
            note: 'Серия профиля, крепёж, состав стекла и применимость к основанию подтверждаются расчётом и документацией выбранной системы.' } },
        { id: 'side-mount', title: `${node.title} — профиль к торцу основания`,
          intro: 'Профиль закрепляется сбоку к несущему торцу основания, с проверкой зоны анкеровки.',
          preset: { mounting: 'Зажимной профиль к торцу основания', mountingPosition: 'Торцевое крепление',
            configuration: `Стеклянное ограждение в боковом опорном профиле; ${node.preset.handrail.toLowerCase()}`,
            note: 'Торцевой узел требует подтверждения несущей основы, анкеров, краевых расстояний и применимости конкретной серии профиля.' } },
      ], 'Профиль поверх основания или к его торцу?');
  }

  if (/^canopies-(?:rods|profile)-single-door-contour$/.test(node.id)) {
    return splitSolution(node,
      'Оба варианта выполняются из плоского стекла. Различается контур детали в плане: прямолинейный срез или плавная дуга.', [
        { id: 'cut-corners', title: 'Плоский козырёк со срезанными углами',
          intro: 'Прямолинейные срезы меняют углы стеклянного покрытия под геометрию входа.',
          preset: { shape: 'Прямолинейный контур со срезанными углами', geometry: 'Плоское стекло',
            configuration: 'Одна плоская секция с прямолинейными срезами',
            note: 'Размеры срезов и положение креплений согласуются по чертежу и расчёту козырька.' } },
        { id: 'radius-outline', title: 'Плоский козырёк с радиусным контуром',
          intro: 'Плавная дуга проходит по внешнему краю плоской стеклянной секции.',
          preset: { shape: 'Радиусный контур в плане', geometry: 'Плоское стекло',
            configuration: 'Одна плоская секция с криволинейным краем',
            note: 'Радиус, обработка кромки и расположение креплений проверяются до изготовления. Изгиб стеклянной поверхности не предусмотрен этим вариантом.' } },
      ], 'Прямолинейные срезы или радиусный край?');
  }
  return node;
}

export const otherTrees = [showers, partitionsTree, ...[doors, stairs, canopies].map(refineConstruction)];
