# React Native UI decision

Дата: 2026-09-16

## Решение для P0

**Не добавлять большой UI framework в текущий P0.**

Причина: главный технический риск пилота сейчас — spatial accuracy, asset pipeline, AR/Quest runtime и field verification, а не скорость сборки обычных форм. Массовая миграция существующего интерфейса перед выездом увеличит поверхность регрессий без прямой ценности для проверки гипотезы.

Вместо этого:
- сохранить React Native primitives;
- постепенно вынести design tokens;
- переиспользовать собственные Button/Card/Sheet/Badge/Section patterns;
- обязательно сохранить accessibilityRole/accessibilityLabel, dynamic text sizing и контраст;
- не связывать spatial runtime с UI framework.

## Кандидат P1 — Tamagui

Repository: https://github.com/tamagui/tamagui
License: MIT

Почему подходит:
- React + React Native;
- design system / style library / components;
- можно внедрять постепенно;
- cross-platform primitives;
- активно развивается.

Когда пересматривать решение:
- появляется City Heritage Studio;
- экранов/форм становится значительно больше;
- возникает повторяемый набор компонентов для музея, редактора, маршрутов, профиля и публикации;
- custom StyleSheet начинает замедлять изменение дизайн-системы.

До этого Tamagui — **watch**, не dependency.

## React Native Paper

Repository: https://github.com/callstack/react-native-paper
License: MIT

Технически зрелый вариант, но Material Design — не тот визуальный язык, который нужен «Москве во времени». Использовать библиотеку только ради компонентов нецелесообразно, если затем большую часть Material-стилистики придётся переопределять.

Статус: reference / fallback, не основной кандидат.

## gluestack-ui

Repository: https://github.com/gluestack/gluestack-ui

Интересен copy-paste подходом, accessibility и NativeWind patterns. Однако в GitHub repository metadata лицензия сейчас не определена однозначно; перед прямым переносом компонентов требуется отдельная проверка конкретных файлов/лицензии.

Статус: research only.

## Что вынести в собственную design system в P0/P1

### Tokens
- background / surface / elevated surface;
- primary historical gold;
- text primary / secondary / muted;
- trust colors;
- success / warning / blocked;
- radius scale;
- spacing scale;
- typography roles;
- minimum touch targets.

### Primitives
- `MoscowButton`;
- `MoscowIconButton`;
- `MoscowCard`;
- `MoscowSheet`;
- `TrustBadge`;
- `SourceBadge`;
- `EraSwitch`;
- `PlaceHeader`;
- `RouteProgress`;
- `SpatialStatus`;
- `EmptyState`;
- `OfflineStatus`.

### Accessibility requirements
- tap target не меньше разумного mobile minimum;
- каждый icon-only control имеет accessibility label;
- не кодировать trust/status только цветом;
- subtitles/transcript для audio;
- AR всегда имеет non-AR fallback;
- large text не должен ломать навигацию;
- motion effects должны иметь reduced-motion fallback.

## Архитектурное правило

UI library никогда не должна определять формат исторического контента или spatial assets.

`PublishedSpatialPackage`, provenance, field verification и GLB model pack остаются независимым domain layer. Поэтому в будущем UI framework можно заменить без миграции исторических данных и spatial pipeline.
