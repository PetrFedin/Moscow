# Moscow — E2E Acceptance Baseline

Дата baseline: 2026-09-16.

## Цель

Проверять Moscow как один пользовательский маршрут, а не как набор отдельных экранов:

`Discover → Map → PhysicalSheet → Story → Time Machine → Archive Lens → 3D → Spatial / AR state machine → Portal transition → Back / Resume`.

## Текущий зелёный baseline

Полный автоматический gate прошёл на product SHA:

`dd032227ab6e62eb53c58492bec6dd2d6e721bb4`

GitHub Actions run: `35163259480`.

На одном и том же SHA успешно прошли:

1. чистая установка dependencies;
2. E2E state-contract tests;
3. interaction-physics regression tests;
4. strict TypeScript;
5. web production export;
6. iOS export с `.native.tsx`, Viro и GLB assets;
7. Android export с `.native.tsx`, Viro и GLB assets;
8. Chromium browser E2E реального пользовательского маршрута.

## E2E state contract

`src/e2e/experienceContract.ts` является чистым контрактом пользовательского состояния.

Проверяемые инварианты:

- выбранное место не теряется между поверхностями;
- эпоха и trust mode переходят из Time Machine в 3D и spatial runtime;
- AR lifecycle допускает только последовательный путь `searching → candidate → anchored → calibrated → verified`;
- незаконный jump сразу в `anchored` или `verified` игнорируется;
- `verified` сам по себе не даёт права на вход в portal;
- production portal требует отдельный `verified → portal-preview → portal-entered` commit;
- возврат из spatial mode сохраняет место, эпоху и trust mode;
- browser preview не может выдавать себя за field-verified AR.

## Interaction Physics E2E

### Map / PhysicalSheet

Chromium действительно выполняет жесты, а не только проверяет наличие компонента:

- `preview → expanded` физическим drag;
- `expanded → preview` обратным drag;
- проверяется реальное Y-положение sheet после spring settle;
- `collapsed / preview / expanded` остаются семантическими состояниями;
- drag внутри допустимого диапазона следует за пальцем 1:1;
- rubber-band применяется только за hard boundary;
- новый touch отменяет settle-animation;
- выбор нового места возвращает карточку в `preview`.

E2E обнаружил реальный defect velocity-overcommit: быстрый обратный drag мог перескочить из `expanded` через `preview` сразу в `collapsed`. Дефект исправлен в общем `resolveSnapPoint()` и защищён отдельными regression tests. Velocity теперь может подтвердить соседний snap от точки начала жеста, но не добавляет лишний переход поверх уже достигнутого пальцем состояния.

### Time Machine

- реальная карточка объекта использует `TimeMachineSlider`;
- движение остаётся direct-manipulation;
- haptic происходит на смысловой смене эпохи, а не на каждом pixel;
- Romanov time state синхронизируется с `1857 / 1859` model state;
- browser E2E взаимодействует с настоящим TimeMachine control в пользовательском Story flow.

### Archive Time Lens / exact resume

Состояние линзы принадлежит общему journey-state, а не отдельной модалке:

- сохраняются `opacity` и `visible`;
- они переживают `Archive → 3D → Back`;
- они сохраняются через AsyncStorage;
- Chromium меняет opacity, уходит в 3D, возвращается и требует ровно тот же отображаемый процент.

### 3D

- rotate/pinch остаются direct manipulation;
- era/trust принимаются извне и возвращаются родителю через `onStateChange`;
- переключение era/trust не сбрасывает пользовательский journey-state;
- key controls используют `PhysicalPressable`;
- критические 3D controls имеют touch target не менее 44 pt;
- web/native controls имеют однозначные accessibility labels;
- Chromium управляет 3D через accessibility contract, а не через случайный DOM-порядок;
- выбранные era/trust передаются дальше в AR/Quest через общий state/storage contract.

### AR / Spatial lifecycle

Пользовательский native entry проходит через `MoscowSpatialJourney`:

- `SEARCHING` — сцена ищет устойчивую поверхность;
- `CANDIDATE` — hit-test нашёл допустимый Depth/Plane/Feature point;
- `ANCHORED` — создан session anchor;
- `CALIBRATED` — calibration profile сохранён;
- `VERIFIED` — только результат `summarizeRomanovReleaseGate`, UI не может выставить его вручную.

`VERIFIED` требует существующий P0 gate: complete survey + cross-device field matrix + verified calibration + verified persistent anchor + independent resolve.

Browser fallback намеренно остаётся `SEARCHING` и явно сообщает, что AR runtime проверяется только в native build.

### Portal transition

`PortalTransitionControl` встроен в пользовательский spatial flow:

- handle следует за пальцем 1:1;
- transition прерываем до commit;
- Chromium выполняет первый drag ниже threshold и проверяет отсутствие portal commit;
- второй drag проходит threshold и проверяет явный `DEMO PORTAL · NOT VERIFIED`;
- production path не может перейти напрямую `verified → portal-entered`;
- обязательна стадия `portal-preview`;
- demo/fallback никогда не подменяет production VERIFIED state;
- `ViroPortalScene` не предоставляет callback достоверного физического пересечения портала, поэтому runtime не выдумывает этот факт.

### Back / Resume

Chromium завершает тот же маршрут возвратом из spatial preview в 3D и проверяет сохранение выбранного trust state. Отдельно Archive Lens round-trip проверяет точное сохранение opacity.

## Что автоматизация НЕ доказывает

Зелёный CI доказывает корректность contract, bundles и browser-level interaction journey, но не означает `field-verified spatial scene`.

Физическими gate остаются:

- фактический survey на Варварке;
- 2 независимых iPhone × 5/10/15 м;
- 2 независимых Android × 5/10/15 м;
- residual error в пределах P0 thresholds;
- persistent anchor host;
- independent resolve на другом физическом устройстве;
- повторная проверка после app restart;
- native map camera continuity;
- tracking loss/recovery;
- daylight/outdoor usability;
- full VoiceOver/TalkBack journey;
- one-handed field usability;
- interruption/resume: background, lock/unlock, системное прерывание;
- physical portal passage;
- Quest physical QA;
- тот же physics-contract на втором независимом heritage object — Old English Court.

## Release rule

Нельзя использовать формулировку `field-verified` или показывать зелёный VERIFIED state в публичном production-demo, пока реальный release gate не вернул `field-verified-spatial-scene`.

Следующий обязательный E2E этап после этого автоматического baseline — physical-device + Varvarka field run, затем повторение тех же правил на Old English Court без object-specific gesture exceptions.
