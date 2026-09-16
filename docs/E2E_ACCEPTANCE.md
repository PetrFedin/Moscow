# Moscow — E2E Acceptance Baseline

Дата baseline: 2026-09-16.

## Цель

Проверять Moscow как один пользовательский маршрут, а не как набор отдельных экранов:

`Discover → Map → PhysicalSheet → Story → Time Machine → 3D → AR state machine → Portal preview → Back/Resume`.

## Автоматический gate на каждый commit в `main`

CI обязан пройти все шаги без исключений:

1. `npm install` — чистое разрешение dependency tree.
2. `npm run test:e2e-contract` — переходы состояния и запрещённые переходы.
3. `npm run typecheck` — строгий TypeScript, включая E2E tests.
4. `npm run build:web` — browser preview bundle.
5. `npm run build:ios` — iOS Expo bundle, включая `.native.tsx`, Viro и GLB assets.
6. `npm run build:android` — Android Expo bundle, включая `.native.tsx`, Viro и GLB assets.
7. HTTP smoke — собранный preview реально отдаёт HTML через локальный HTTP server.

Baseline commit `02edfd158a7598a32d08be21076adb9cf33d5218` прошёл все семь шагов.

## E2E state contract

`src/e2e/experienceContract.ts` является чистым контрактом пользовательского состояния.

Проверяемые инварианты:

- выбранное место не теряется между поверхностями;
- эпоха и trust mode переходят из Time Machine в 3D и spatial runtime;
- AR lifecycle идёт только последовательно: `searching → candidate → anchored → calibrated → verified`;
- незаконный переход сразу в `anchored` или `verified` игнорируется;
- production portal нельзя открыть до `verified`;
- возврат из spatial mode сохраняет эпоху и trust mode;
- browser preview не может выдавать себя за field-verified AR.

## Interaction Physics E2E

### Map

- `PhysicalSheet` имеет семантические состояния `collapsed / preview / expanded`;
- состояние не выводится из числового порядка Y;
- drag внутри диапазона следует за пальцем 1:1;
- overscroll получает rubber-band только за пределами диапазона;
- release учитывает положение и velocity;
- новый touch отменяет текущую settle-анимацию;
- смена sheet-state не remount'ит карточку;
- выбор нового места remount'ит карточку в `preview`.

### Time Machine

- используется `TimeMachineSlider`;
- непрерывное движение остаётся direct-manipulation;
- haptic происходит на смысловой смене эпохи, а не на каждом pixel;
- Romanov time state синхронизируется с `1857 / 1859` model state.

### 3D

- era/trust принимаются извне и возвращаются родителю через `onStateChange`;
- rotate/pinch остаются direct manipulation;
- controls используют `PhysicalPressable`;
- выбранные era/trust передаются дальше в AR/Quest через общий storage contract.

### AR

Пользовательский native entry теперь проходит через `MoscowSpatialJourney`:

- `SEARCHING` — сцена ищет устойчивую поверхность;
- `CANDIDATE` — hit-test нашёл допустимый Depth/Plane/Feature point;
- `ANCHORED` — `createAnchoredNode()` вернул реальный session `anchorId`;
- `CALIBRATED` — calibration profile сохранён;
- `VERIFIED` — только результат `summarizeRomanovReleaseGate`, UI не может выставить его вручную.

`VERIFIED` требует существующий P0 gate: complete survey + cross-device field matrix + verified calibration + verified persistent anchor + independent resolve.

### Portal

- production portal заблокирован до `field-verified-spatial-scene`;
- dev/demo может открыть только явно маркированный `DEMO PREVIEW`;
- `ViroPortalScene` не предоставляет callback фактического пересечения портала, поэтому runtime не подделывает `portal-entered`;
- фактический passage остаётся пунктом physical-device QA.

## Что автоматизация НЕ доказывает

Зелёный CI не означает завершённый полевой E2E. До статуса `field-verified spatial scene` обязательны:

- фактический 5-точечный survey на Варварке;
- 2 независимых iPhone × 5/10/15 м;
- 2 независимых Android × 5/10/15 м;
- residual error в пределах внутренних P0 thresholds;
- persistent anchor host;
- resolve на другом физическом устройстве;
- повторная проверка после перезапуска приложения;
- daylight/outdoor usability;
- VoiceOver/TalkBack;
- tracking loss/recovery;
- portal passage на физическом устройстве;
- interruption/resume: звонок/background/lock/unlock.

## Release rule

Нельзя использовать формулировку `field-verified` или показывать зелёный VERIFIED state в публичном production-demo, пока реальный release gate не вернул `field-verified-spatial-scene`.

Следующий обязательный E2E этап после автоматического baseline — physical-device + Varvarka field run.
