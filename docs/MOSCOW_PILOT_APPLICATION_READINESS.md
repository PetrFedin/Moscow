# Moscow Pilot Application Readiness

Проверка структуры: 29.09.2026.

## Зачем нужен этот документ

Цель — не заполнить заявку вымышленными данными, а перевести существующий CITY PILOT / Government Data Room в submission-ready набор для заявки на статус участника пилотного тестирования инновационного решения в Москве.

Официальная форма заявки требует как сведения о самом решении, так и сведения юридического лица / ИП. Поэтому product repository не должен автоматически заполнять:

- ИНН / КПП;
- юридический и фактический адрес;
- корпоративные заверения;
- фактическую выручку;
- тарифы;
- сведения о происхождении компонентов;
- applicant-side IP declarations;
- выбранную площадку пилота.

## Официальная основа

Основные нормативные ориентиры:

- постановление Правительства Москвы № 631-ПП «О проведении пилотных тестирований инновационных решений в городе Москве»;
- приказ ДПИР Москвы от 22.04.2025 № П-18-12-113/25;
- приложение 3 к Положению — форма заявки на присвоение статуса участника пилотного тестирования инновационного решения.

Официальный документ Москвы с актуальной формой заявки:

https://www.mos.ru/upload/documents/files/9037/23042025_MEC-01-06-1320_25_Kostroma_KG_Avdeeva_AI_removed.pdf

В форме отдельно предусмотрено приложение презентации инновационного решения в PDF/PPTX и документы по интеллектуальным правам / лицензиям, если применимо.

## Текущий статус

Application Readiness реализован в:

- `src/government/moscowPilotApplicationReadiness.ts`;
- `src/government/MoscowPilotApplicationReadinessPanel.tsx`;
- `tests/moscowPilotApplicationReadiness.test.ts`.

Он не является юридическим заключением и не подтверждает eligibility заявителя.

## Что уже можно перенести из проекта

### Решение

Готовы:

- рабочее название продукта / пилота;
- описание platform/heritage/destination architecture;
- Moscow positioning;
- pilot methodology;
- acceptance matrix;
- final report structure;
- security/data-flow draft;
- IP/handover architecture;
- operations/SLA draft;
- funding/scale logic.

### Пилот

Готовы project-side:

- bounded pilot scope «Варварка во времени»;
- Romanov field proof methodology;
- Old English Court repeatability pipeline;
- supervised visitor pilot protocol;
- live-provider authority contract;
- evidence-based acceptance.

Финальная версия этих материалов всё равно требует buyer/operator review.

## Что должен предоставить заявитель

### Корпоративные данные

- полное наименование юрлица / ИП;
- ИНН;
- КПП;
- фактический адрес;
- юридический адрес;
- телефон;
- e-mail;
- официальный сайт;
- руководитель;
- контактное лицо;
- полномочия подписанта.

### Eligibility

- отсутствие применимых процедур ликвидации / банкротства / приостановления;
- лицензия, если соответствующий вид деятельности лицензируется;
- документы, подтверждающие исключительные права или законные основания использования РИД;
- обязательство соблюдать права третьих лиц.

### Коммерциализация

- applicant-owned commercialization model;
- стоимость решения / тарифная сетка;
- фактическая выручка от предлагаемого решения за три года;
- страна происхождения решения / компонентов / услуг / программного кода и требуемые доли стоимости.

Эти сведения нельзя получать из маркетингового текста или автоматически из project repository.

## Что ещё надо подготовить проекту

### 1. 10–12 slide decision deck

Это единственный явно отсутствующий formal artifact в Government Delivery Manifest.

Deck должен использовать те же truth boundaries, что CITY PILOT:

- никакого field-verified до field evidence;
- никакого representative research без основания;
- никакого утверждённого бюджета;
- никакого автоматического ROI;
- никакой гарантированной закупки / инвестиции / субсидии.

### 2. Аналоги в России и мире

Нужна нейтральная source-backed таблица:

- продукт / сервис;
- geography;
- user job;
- history/heritage layer;
- live destination layer;
- routing / booking;
- AR / spatial;
- editorial / rights authority;
- business / public model;
- сильные стороны;
- ограничения;
- отличие Moscow.

RUSSPASS / «Узнай Москву» лучше описывать как существующие городские каналы и потенциальные integration surfaces, а не искусственно как «слабых конкурентов».

### 3. Applicant commercial pack

Отдельно от product architecture:

- pilot budget;
- commercial model;
- tariff logic;
- unit economics assumptions;
- applicant revenue history;
- cost-origin breakdown.

## Что требует Москвы / Оператора / Площадки

До submission-ready состояния внешне должны быть подтверждены:

- pilot site;
- city problem owner;
- heritage/content contacts;
- integration/data contact;
- применимый формат проведения пилота;
- buyer/operator review methodology / acceptance;
- формат соглашения и связанных финансовых механизмов.

Само соглашение о пилоте и статус участника не считаются возникшими до официального оформления.

## Machine-readable readiness

JSON:

```bash
npm run government:application-readiness
```

Короткий human-readable blocker list:

```bash
npm run government:application-readiness -- --text
```

Команда только читает текущую authority. Она не отправляет заявку и не меняет статусы.

## Application Working Session — 60 минут

### 0–10 минут — applicant identity

Закрыть:

- legal entity / ИП;
- реквизиты;
- подписант;
- контакты.

### 10–20 минут — IP / legal

Закрыть:

- software IP;
- historical assets;
- 3D assets;
- third-party libraries / media;
- лицензируемая деятельность.

### 20–35 минут — commercial

Закрыть:

- модель коммерциализации;
- тарифную сетку;
- выручку за три года;
- origin/cost breakdown.

### 35–45 минут — solution comparison

Согласовать:

- Russian analogs;
- global analogs;
- преимущества;
- ограничения;
- evidence language.

### 45–55 минут — pilot site / city inputs

Зафиксировать:

- площадку;
- city owner;
- heritage owner;
- integration owner;
- visitor research owner.

### 55–60 минут — attachments / owner / due

Проверить:

- decision deck;
- IP documents;
- лицензии, если применимо;
- финального owner каждой секции заявки.

## Definition of Done

Application package считается подготовленным только когда:

1. все applicant-owned поля заполнены заявителем;
2. legal review закрыт;
3. площадка подтверждена внешне;
4. decision deck существует;
5. project drafts подтверждены соответствующими owners;
6. application readiness показывает `submissionReady=true`.

Это всё ещё не означает одобрение пилота или финансовой поддержки.
