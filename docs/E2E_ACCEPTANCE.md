# Moscow — E2E Acceptance Baseline

Дата baseline: 2026-09-17.

## Цель

Проверять Moscow как один пользовательский маршрут и как повторяемую платформенную механику для разных heritage objects, а не как набор отдельных экранов:

`Discover → Map → PhysicalSheet → Story → Time Machine → Archive Lens / capability gate → 3D → Spatial / AR state machine → Portal transition → Back / Resume`.

## Текущий зелёный baseline

Полный автоматический gate прошёл на product SHA:

`6b51f70cb5bf7f3d7f84efae550bddd6d50560f6`

GitHub Actions run: `35222772788`.

На одном и том же SHA успешно прошли:

1. чистая установка dependencies;
2. E2E state-contract tests;
3. interaction-physics regression tests;
4. place-experience capability regression tests;
5. strict TypeScript;
6. web production export;
7. iOS export с `.native.tsx`, Viro и GLB assets;
8. Android export с `.native.tsx`, Viro и GLB assets;
9. Chromium browser E2E полного двухобъектного пользовательского маршрута.

Всего pure contract/regression gate сейчас содержит 12 тестов.

## Два независимых heritage objects

### Палаты бояр Романовых

Текущий spatial candidate pipeline сохраняется:

- Time Machine — ready;
- Archive Lens — ready;
- 3D — candidate;
- spatial runtime — candidate;
- runtime pack — `romanov-v1`;
- историческая шкала синхронизирована с моделями `1857 / 1859`.

### Старый Английский двор

Второй объект больше не является только карточкой и не заимствует Romanov runtime:

- Time Machine — ready;
- подтверждённые/маркированные слои: `1556 → 1960-е → 1994 → Сегодня`;
- слой `1960-е` явно маркируется как `Исследовательская реконструкция`;
- Archive Lens — `needs-asset`;
- 3D — `needs-asset`;
- spatial runtime — `needs-asset`;
- чужие Romanov model/runtime assets открыть нельзя.

Chromium проходит `Старый Английский двор → 1556 → 1960-е`, проверяет trust label и затем требует fail-closed состояние недоступных Lens/3D controls. После этого тот же E2E возвращается к Романовым и продолжает полный spatial journey.

`src/spatial/placeExperienceRegistry.ts` является единым capability authority для объектных возможностей. UI больше не должен решать готовность 3D/AR через object-specific проверки вида `selected.id === ...`.

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
- неизвестный или неподготовленный объект fail-closed и не может открыть runtime другого объекта;
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

E2E ранее обнаружил реальный velocity-overcommit: быстрый обратный drag мог перескочить из `expanded` через `preview` сразу в `collapsed`. Дефект исправлен в общем `resolveSnapPoint()` и защищён regression tests. Velocity может подтвердить соседний snap от точки начала жеста, но не добавляет лишний переход поверх уже достигнутого пальцем состояния.

### Time Machine

- реальные карточки объектов используют один Time Machine contract;
- iOS/Android сохраняют native `@react-native-community/slider`;
- browser preview использует отдельный semantic HTML `input[type=range]`, а не responder-only web fallback пакета;
- web control экспонирует `role=slider`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`;
- keyboard `ArrowRight` доказан Chromium как переход смысловой эпохи;
- haptic происходит на смысловой смене эпохи, а не на каждом pixel;
- Romanov time state синхронизируется с `1857 / 1859` model state;
- Old English Court доказан как независимый Time Machine flow: `1556 → 1960-е`.

### Shared PhysicalPressable accessibility

Общий physical-control primitive теперь является semantic button по умолчанию:

- `accessibilityRole="button"`;
- реальный `disabled` и `accessibilityState.disabled` используют один нормализованный boolean-state;
- визуально disabled control не может оставаться семантически enabled;
- это правило применяется ко всем CTA, включая fail-closed Lens/3D controls Английского двора.

### Archive Time Lens / exact resume

Состояние линзы принадлежит общему journey-state, а не отдельной модалке:

- сохраняются `opacity` и `visible`;
- они переживают `Archive → 3D → Back`;
- они сохраняются через AsyncStorage;
- Chromium меняет opacity, уходит в 3D, возвращается и требует ровно тот же отображаемый процент.

Для Старого Английского двора Archive Lens остаётся недоступной до появления проверенного лицензированного исторического asset. Современное свободное фото не подменяет исторический `before`-слой.

### 3D

- rotate/pinch остаются direct manipulation;
- era/trust принимаются извне и возвращаются родителю через `onStateChange`;
- переключение era/trust не сбрасывает пользовательский journey-state;
- key controls используют `PhysicalPressable`;
- критические 3D controls имеют touch target не менее 44 pt;
- web/native controls имеют однозначные accessibility labels;
- Chromium управляет 3D через accessibility contract, а не через случайный DOM-порядок;
- выбранные era/trust передаются дальше в AR/Quest через общий state/storage contract;
- object capability registry не разрешает открыть Romanov 3D для другого heritage object.

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

Зелёный CI доказывает корректность contracts, capability isolation, bundles и browser-level interaction journey, но не означает `field-verified spatial scene`.

Физическими/контентными gate остаются:

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
- лицензированное историческое изображение для Archive Lens Старого Английского двора;
- собственный проверенный 3D asset pack Старого Английского двора;
- собственная spatial/AR сцена и её field QA для Старого Английского двора.

## Release rule

Нельзя использовать формулировку `field-verified` или показывать зелёный VERIFIED state в публичном production-demo, пока реальный release gate не вернул `field-verified-spatial-scene`.

Второй объект уже проходит общий Time Machine/capability interaction contract без object-specific gesture exceptions, но Definition of Done всей spatial-платформы не закрывается до появления собственных проверенных spatial assets Старого Английского двора и physical-device/Varvarka QA.
