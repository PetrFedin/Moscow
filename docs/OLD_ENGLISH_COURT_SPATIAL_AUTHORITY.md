# Старый Английский двор — spatial authority v1

Статус: **собственная spatial authority создана; реальный 3D/AR asset ещё не принят и не заявлен как готовый**.

## Зачем второй объект

Старый Английский двор должен доказать, что spatial-контур Moscow повторяем между памятниками и не является набором Romanov-specific исключений.

Поэтому объект не имеет права:

- использовать Romanov GLB, калибровку, control points или persistent anchor;
- становиться `model3d/spatial = candidate` только потому, что runtime уже существует у другого места;
- принимать модель без подтверждённых прав, provenance, метрического масштаба и бинарной идентичности.

## Текущая authority

- id: `old-english-court-spatial-authority-v1`
- place: `old-english-court`
- единицы будущей модели: метры
- пространственная система полевого survey: WGS84
- статус: `asset-intake`

Исторические слои:

1. `1556-documented` — документированный слой английского торгового подворья.
2. `1960s-restoration-reconstructed` — реставрационный слой, явно маркируемый как реконструкция.
3. `1994-museum-documented` — документированный музейный слой.

## Gate 1 — model asset intake

До появления реального GLB объект остаётся `needs-asset`.

Модель-кандидат принимается в intake только если одновременно есть:

- собственный id и version;
- собственный asset path;
- полный набор source ids authority;
- `rightsStatus=verified` + ссылка/идентификатор evidence по правам;
- `modelUnits=meters`;
- `metricScaleStatus=verified`;
- SHA-256 бинарного файла.

Этот gate **не открывает AR**. Он только разрешает перейти к проверке самой модели.

## Gate 2 — model/mobile performance

После реального GLB нужен отдельный performance manifest и тот же класс автоматического контроля, что для Romanov:

- валидный GLB 2.0;
- размер/mesh/material/texture budgets;
- mobile export web/iOS/Android;
- физические FPS/GPU/thermal остаются отдельным device evidence.

## Gate 3 — metric authority

Для Старого Английского двора создаётся собственная metric authority. Нельзя копировать Romanov scale или transform.

Нужны:

- подтверждённые метры модели;
- явный meters-per-model-unit;
- source-backed scale evidence;
- запрет release при выходе масштаба за установленный tolerance.

## Gate 4 — façade control points

Control points выбираются только после сопоставления принятой модели с текущим фасадом.

До полевого осмотра здесь нельзя заранее объявлять произвольные углы/окна «стабильными».

Минимум будущего v1:

- 5 измеряемых точек;
- минимум 3 alignment points;
- отдельный versioned control-point set;
- evidence ref на выбор каждого физического репера.

## Gate 5 — field proof

После model + metric + control-point authority применяется тот же класс доказательства, что и Romanov:

- approved survey;
- measured residuals 5/10/15 м;
- одна exact calibration placement на три дистанции;
- минимум 2 физических iOS + 2 Android;
- финальная hosting placement сама входит в матрицу;
- persistent anchor host continuity;
- independent resolve;
- только затем spatial release candidate может стать field-verified.

## Что сейчас специально остаётся BLOCKED

- реальный GLB;
- права на конкретный 3D asset;
- checksum реального бинарника;
- metric authority;
- control-point set;
- survey;
- field residuals;
- cloud anchor;
- portal/VR.

Это не «недоделанный экран», а fail-closed состояние второго объекта до появления доказательств.
