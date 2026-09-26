# Варварка во времени — матрица результата и приёмки пилота

Статус: рабочая спецификация для внутренней подготовки городского пилота.

## 1. Предмет пилота

Пилот проверяет не отдельную AR-сцену, а воспроизводимый городской контур цифрового исторического объекта:

`источник → права → историческое утверждение → реконструкция → модель → пространственная проверка → публикация → пользовательский опыт → измеримый результат`.

Территория: Варварка — Зарядье.

Пилотный маршрут: 5 остановок.

Spatial hero objects:

1. Палаты бояр Романовых;
2. Старый Английский двор.

## 2. Что является результатом

Результатом не считаются сами по себе:

- презентация;
- демонстрационный ролик;
- количество созданных GLB;
- факт запуска AR;
- количество экранов приложения;
- количество скачиваний тестовой сборки.

Результатом считается совокупность проверяемых артефактов и evidence.

## 3. Приёмочный контур A — историческая и правовая доказательность

### A1. Источники

Для каждого hero object должен существовать PublishedSpatialPackage с:

- stable place id;
- списком источников;
- датой доступа;
- правовым статусом каждого источника;
- historical claims;
- связью claim → reconstruction element;
- trust classification.

**Evidence:** сериализованный PublishedSpatialPackage и отчёт Studio validation.

### A2. Права

Не должно оставаться `review-required` для материалов, которые фактически публикуются во внешнем канале.

Restricted source допустим только при документированном основании использования и согласованном режиме публикации.

**Evidence:** rights review в City Heritage Studio и отсутствие соответствующих publication blockers.

### A3. Независимая проверка

Историческая, правовая и техническая проверки должны быть выполнены отдельными review roles для текущей revision.

**Evidence:** Studio audit и три current-revision approvals.

## 4. Приёмочный контур B — 3D и spatial authority

### B1. Один точный model package

Для каждого публикуемого hero object:

- versioned GLB;
- repository blob SHA;
- portable SHA-256;
- byte size;
- model units;
- model-pack binding;
- перечисленные reconstruction elements;
- допустимые runtime modes.

**Evidence:** PublishedSpatialPackage + machine validation.

### B2. Romanov field survey

Палаты Романовых должны иметь проверенный survey packet по текущему Romanov P0 contract.

Минимум:

- 5 фасадных control points;
- явная методика измерения;
- точность измерения;
- evidence reference;
- measured by;
- measured at;
- утверждение survey packet.

**Evidence:** реальный survey packet. Синтетические fixtures из tests доказательством не являются.

### B3. Cross-device matrix

Romanov release gate требует полный physical matrix:

- минимум 2 независимых iOS devices;
- минимум 2 независимых Android devices;
- расстояния 5 / 10 / 15 м;
- минимум 12 complete field sessions.

**Evidence:** field-session records от физических устройств.

### B4. Alignment residual

Каждая field session должна содержать measured observations, достаточные для расчёта residual error по действующему Romanov alignment contract.

**Evidence:** сохранённые observations и итог release gate.

Точные допуски не следует менять в коммерческом документе вручную: authority находится в действующем кодовом contract и соответствующей версии документации.

### B5. Persistent anchor

Требуются:

- host;
- host localization continuity;
- persistent anchor record;
- independent resolve на другом физическом устройстве;
- verified anchor evidence;
- повторный resolve после restart/recovery согласно field protocol.

**Evidence:** anchor proof records.

### B6. Публичный статус

Только результат действующего release gate может перевести объект в:

`field-verified`.

Ручное выставление зелёного статуса, мок или демонстрационный fallback не являются приёмкой.

## 5. Приёмочный контур C — повторяемость

Старый Английский двор должен пройти общий pipeline без использования Romanov evidence.

Требуется собственный:

- source set;
- rights review;
- claims;
- reconstruction elements;
- model pack;
- metric/control-point authority;
- field evidence;
- review cycle;
- publication snapshot.

**Критерий:** второй объект проходит общий PublishedSpatialPackage + City Heritage Studio workflow без object-specific исключения, которое фактически делает pipeline Romanov-only.

## 6. Приёмочный контур D — пользовательский пилот

Первый пользовательский тест проводится по `PILOT_RESEARCH_PROTOCOL.md`.

Целевой размер первого supervised sample: 20–50 участников.

Это usability/product pilot. Он не объявляется статистически репрезентативным исследованием жителей или туристов Москвы.

### Основная воронка

`app open → route start → first stop complete → route complete → recap → continue`

### Дополнительные наблюдения

- audio start / complete;
- transcript;
- Time Machine;
- archive;
- 3D;
- AR;
- physical arrival;
- ручное завершение;
- post-walk destination;
- friction points наблюдателя.

**Evidence:** aggregate-only reports, cohort rollup, qualitative synthesis.

Raw local identifiers не включаются в cohort output.

## 7. Приёмочный контур E — эксплуатация и доступность

Пилот должен отдельно зафиксировать результаты physical QA:

- daylight readability;
- one-handed use;
- tracking loss/recovery;
- background/foreground;
- lock/unlock;
- interruption/resume;
- offline route operation;
- native map continuity;
- VoiceOver/TalkBack journey;
- subtitles/transcript;
- non-AR fallback.

**Evidence:** device/test matrix с passed/failed/blocker и ссылкой на доказательство.

## 8. Приёмочный контур F — City Heritage Studio

Минимальный служебный workflow:

`draft → review → approvals → immutable publication`.

Обязательные свойства:

- editor;
- historian reviewer;
- rights reviewer;
- technical reviewer;
- publisher;
- separation of duties;
- revision invalidates stale approvals;
- publication snapshot immutable;
- next package version increments;
- public spatial publish fail-closed without field verification.

## 9. Что можно показать заказчику до field verification

Допустимые формулировки:

- production candidate;
- internal preview;
- технический прототип;
- подготовленный field-test flow;
- machine-validated package;
- historical/reconstruction provenance.

Недопустимые формулировки до фактического доказательства:

- field-verified;
- подтверждённая пространственная точность;
- проверенный persistent anchor;
- доказанная cross-device repeatability;
- готовый к городскому масштабированию spatial standard, если второй объект ещё не прошёл pipeline.

## 10. Итоговый комплект пилота

К закрытию пилота должен существовать единый evidence bundle:

1. executive one-pager;
2. утверждённое техническое задание;
3. эта матрица приёмки;
4. Romanov PublishedSpatialPackage;
5. Old English Court PublishedSpatialPackage;
6. Studio audit/history;
7. rights matrix;
8. field survey evidence;
9. device-distance matrix;
10. residual/alignment report;
11. persistent-anchor proof;
12. user pilot cohort report;
13. qualitative user-test summary;
14. accessibility/device QA;
15. architecture/integration scheme;
16. security/data-flow note;
17. operations/SLA draft;
18. IP and source-material handover matrix;
19. scale-up estimate assumptions;
20. final pilot report.

## 11. Стоимость

Стоимость пилота в этой спецификации намеренно не фиксируется.

До расчёта должны быть подтверждены:

- фактический объём 3D production для второго объекта;
- стоимость и формат геодезического/обмерного survey;
- объём правовой очистки контента;
- требования к размещению backend/Studio;
- состав production audio;
- требуемые интеграции;
- требования заказчика к сопровождению и SLA.

Любая цифра до этого является оценкой, а не проверенной сметой.

## 12. Решение после пилота

Пилот должен дать достаточные данные для отдельного решения о масштабировании.

Форма решения:

- какие части технологии доказаны;
- какие не доказаны;
- стоимость и срок производства следующего объекта;
- какие операции требуют разработчика;
- какие выполняются учреждением через Studio;
- какие интеграции необходимы;
- какие ограничения прав/данных остаются;
- целесообразный следующий территориальный пакет.

До получения этих данных нельзя выдавать масштабирование на весь город за уже доказанную экономику.
