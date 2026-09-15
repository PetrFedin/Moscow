# Moscow Interaction Physics v1

Статус: **обязательный UX-стандарт для новых экранов и spatial-сцен Moscow**.

Цель: приложение должно ощущаться как единая физическая среда, а не набор независимых экранов. Карта, карточки мест, машина времени, 3D, AR, VR, аудио и маршрут используют один язык движения, отклика и глубины.

---

## 1. Принципы

### 1.1. Отклик начинается в момент касания
Пользователь не должен ждать `onPress` после отпускания пальца, чтобы понять, что действие принято.

- primary/secondary action реагирует на `press-in`;
- визуальный feedback начинается в тот же кадр;
- тактильный feedback используется только для значимых состояний;
- hover никогда не является единственным подтверждением действия.

### 1.2. Drag follows the finger
Во время активного жеста объект следует за пальцем 1:1. Spring/easing применяется после отпускания, а не между пальцем и объектом.

### 1.3. Любая анимация прерываема
Любой переход можно остановить, развернуть или продолжить в другом направлении из текущего состояния.

Запрещено:
- блокировать UI до конца декоративной анимации;
- запускать новую анимацию из заранее заданной стартовой точки, если текущая ещё не закончилась;
- принудительно возвращать пользователя в начало жеста.

### 1.4. Переход сохраняет пространственный контекст
`map → place → model3d → AR → VR` должен восприниматься как углубление в один объект.

Карточка места не исчезает без причины: её геометрия/позиция становится исходной точкой следующего состояния.

### 1.5. Motion communicates meaning
Анимация существует только если объясняет:
- выбор;
- изменение состояния;
- связь между объектами;
- фиксацию/привязку;
- успешное завершение действия.

### 1.6. История не должна выглядеть как игра
Упругость, parallax и depth используются сдержанно. Приложение должно ощущаться точным, архитектурным и спокойным.

---

## 2. Interaction states

Каждый интерактивный элемент должен иметь явные состояния:

`idle → press-in → active/dragging → release → settle`

Дополнительно допускаются:

- `loading`
- `locked`
- `success`
- `error`
- `disabled`

### Требования

- `press-in` не ждёт сетевого или navigation action;
- `dragging` не использует easing;
- `release` учитывает velocity;
- `settle` заканчивается в одном из заранее определённых stable states;
- новое касание во время `settle` немедленно перехватывает управление.

---

## 3. Motion tokens

Токены являются базовыми значениями. Экран не должен создавать произвольные duration/spring-константы без отдельного обоснования.

### Durations

| Token | Value | Use |
|---|---:|---|
| `instant` | 80 ms | press feedback, icon state |
| `fast` | 140 ms | small controls, opacity |
| `medium` | 220 ms | cards, panels |
| `slow` | 340 ms | full-screen continuity transitions |

### Springs

#### `firm`
Для sheet snap, object card, time stop.

- damping: 24
- stiffness: 260
- mass: 0.82
- overshoot: minimal

#### `soft`
Для secondary depth/parallax.

- damping: 22
- stiffness: 190
- mass: 0.90

#### `lock`
Для AR anchor / successful spatial lock.

- damping: 28
- stiffness: 340
- mass: 0.72

### Scale

- press scale: `0.985`
- strong spatial CTA: `0.975`
- card active elevation scale: `1.000`
- never use bounce > `1.015` in the core city UI

### Opacity

- disabled: `0.42`
- secondary inactive: `0.68`
- backdrop: `0.54–0.72` depending on depth

---

## 4. Gesture rules

### 4.1. Gesture priority

1. system back / OS edge gesture
2. AR direct manipulation
3. map pan / pinch
4. sheet/card drag
5. horizontal media/time gesture
6. tap/press

Nested gestures must fail explicitly rather than fight for control.

### 4.2. Snap points

Bottom sheets and expandable place cards use stable states only:

- collapsed
- preview
- expanded

Release resolution considers both displacement and velocity.

### 4.3. Rubber band

Resistance is allowed only beyond a hard boundary.

- first 24 px: near-linear
- next range: increasing resistance
- no cartoon overshoot

### 4.4. Cancel/reverse

A gesture that has crossed a visual transition may still reverse before the final semantic commit.

Example: user starts opening a place card, changes direction, and returns to map without waiting for an animation cycle.

---

## 5. Haptic grammar

Haptic feedback is semantic, not decorative.

| Event | Feedback |
|---|---|
| normal button confirmation | light impact |
| epoch snap / important discrete stop | selection |
| route stop completed | medium impact |
| AR local anchor created | medium impact |
| persistent anchor verified | success notification |
| field verification failed | warning notification |
| destructive/reset operation | warning before commit |

Do not trigger repeated haptics continuously during drag.

---

## 6. Core patterns

### Pattern A — Place card on map

**Intent:** pull history out of the city without losing map context.

- marker selection immediately changes marker state;
- card grows from the selected context;
- drag follows finger directly;
- map depth/parallax responds secondarily;
- three snap states: collapsed / preview / expanded;
- new touch interrupts settle;
- closing restores previous map camera state.

### Pattern B — Time Machine

**Intent:** time behaves as a manipulable layer.

- reveal tracks finger continuously;
- historically significant dates are magnetic stops;
- haptic fires only when entering a new discrete epoch;
- moving backward is identical in quality to moving forward;
- archival image, labels, hotspots and 3D state stay synchronized;
- switching trust mode never moves camera unexpectedly.

### Pattern C — Archive → 3D

**Intent:** the model emerges from evidence rather than appearing as a disconnected mode.

- selected archival state remains visible through transition start;
- 3D model opens using the same era/trust state;
- camera framing begins from the archival viewpoint where possible;
- back returns to the exact prior archive state.

### Pattern D — 3D inspection

- drag rotates with no delayed interpolation;
- pinch scales continuously;
- release may use restrained inertia;
- hotspot selection does not navigate away from model;
- detail card appears as an overlay tied to the selected model point;
- era/trust switching preserves user camera orientation.

### Pattern E — AR alignment

States:

`searching → candidate → anchored → calibrated → verified`

The UI must visually distinguish them.

- reticle follows tracking state;
- successful local anchor has one firm visual settle + haptic;
- manual calibration controls react continuously;
- calibration can be cancelled/reverted without restarting AR session;
- tracking loss must not silently look like a valid lock.

### Pattern F — Portal to VR / historical interior

- portal originates from a spatially meaningful element;
- opening can be interrupted;
- user can retreat before semantic entry commit;
- transition uses depth and scale, not hard screen cut;
- Quest and phone use the same historical scene package and era state.

---

## 7. Screen scenarios

### 7.1. Discover → Map
No hard reset of selected place. The same selected place id survives the transition.

### 7.2. Map → Place
Map remains contextual background until place reaches expanded state.

### 7.3. Place → Time Machine
Time controls appear from within the place surface; they do not replace the place with another unrelated screen.

### 7.4. Time Machine → 3D
Era and trust mode are passed unchanged to the 3D model viewer.

### 7.5. 3D → AR
Model version, era and trust mode remain identical. Only runtime changes.

### 7.6. AR → VR / Quest
The user enters the same `PublishedSpatialPackage`; no separate manually maintained VR asset fork is allowed.

---

## 8. Accessibility and reduced motion

Interaction physics must degrade gracefully.

When reduced motion is enabled:

- remove parallax;
- reduce scale interpolation;
- replace long continuity transitions with short fades;
- retain immediate press feedback;
- retain semantic haptics when the platform/user settings permit them;
- never remove state communication just because motion is reduced.

Touch targets:

- minimum 44×44 pt equivalent;
- critical outdoor controls should target ~48–52 pt.

Outdoor use:

- important text cannot rely on low-contrast translucent surfaces;
- AR controls require a high-contrast safe mode.

---

## 9. Performance targets

These are product targets, not claims about every device.

- interaction feedback should begin within one rendered frame;
- drag must remain visually attached to pointer under expected device load;
- avoid JS-thread-driven per-frame gesture animation for critical drag interactions;
- no blocking analytics/network work on press or drag path;
- 3D/AR controls must remain responsive while models stream/load;
- heavy transitions degrade before direct manipulation does.

Priority under load:

1. direct manipulation
2. navigation/state confirmation
3. text/content
4. decorative motion

---

## 10. Acceptance criteria

### Button
- reacts on press-in;
- active state visible before semantic action completes;
- can be released/cancelled correctly;
- does not rely on hover;
- ≥44 pt target.

### Place sheet/card
- follows finger directly;
- has deterministic snap result;
- can be interrupted mid-settle;
- map does not unexpectedly reset;
- supports system back gesture.

### Time slider
- visual layer follows the finger continuously;
- epoch snap produces one semantic haptic;
- reverse motion is symmetrical;
- source/era/trust state never desynchronizes.

### 3D viewer
- rotate/pinch direct manipulation remains responsive;
- changing era does not reset camera without reason;
- changing trust mode preserves era and viewpoint;
- returning to archive restores previous state.

### AR
- tracking state is always visible;
- anchor candidate and verified anchor are visually different;
- manual adjustment is reversible;
- failed tracking cannot be mistaken for success;
- calibration persists only according to field-verification rules.

### Portal / VR
- portal transition is interruptible;
- historical scene state is inherited from the same spatial package;
- user can exit without losing route/place progress.

---

## 11. Forbidden patterns

Do not ship:

- delayed press feedback;
- animation locks;
- decorative bounce on every action;
- different gesture physics for visually identical controls;
- route/modal transitions that reset user state;
- AR lock that visually remains “verified” after tracking loss;
- separate hand-maintained GLB versions for 3D, AR and Quest;
- hidden historical uncertainty behind photorealism.

---

## 12. Engineering mapping

Foundation stack:

- React Native / Expo
- `react-native-gesture-handler` for gesture arbitration
- `react-native-reanimated` + worklets for direct manipulation and interruptible animation
- `expo-haptics` for semantic feedback
- Viro for 3D/AR/VR direct spatial interaction

The specification is authoritative; library APIs are implementation details and may change without changing these UX rules.

---

## 13. Rollout order

1. `PhysicalPressable` primitive
2. motion/haptic tokens
3. map place sheet
4. Time Machine direct manipulation
5. Archive → 3D shared transition
6. 3D viewer gesture consistency
7. AR alignment states
8. portal transition
9. reduced-motion audit
10. outdoor usability test

The first reference implementation is **Romanov Chambers**. The second validation object is **Old English Court**. A rule becomes a platform standard only after it works across both objects without object-specific exceptions.
