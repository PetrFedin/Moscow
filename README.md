# Moscow — город как машина времени

Мобильное приложение для жителей и гостей Москвы: история места, прогулки, архивные виды, интерактивные сравнения эпох и будущие AR/VR-сцены.

## Продуктовый принцип

Это **не сайт и не электронный путеводитель**. Основной продукт — мобильное приложение для прогулки по реальному городу.

Пользователь должен иметь возможность:

- открыть интересные места рядом;
- понять, почему место важно за 30–60 секунд;
- сравнить современный вид с историческим;
- переключать эпохи и изменения объекта;
- пройти готовую тематическую прогулку;
- сохранять места, заметки и личную коллекцию открытий;
- работать с заранее загруженным маршрутом без сети;
- запускать одну и ту же историческую spatial-сцену в 3D viewer, AR на телефоне и VR на Quest.

## Архитектурные слои

Moscow развивается как единая городская spatial-платформа:

1. **Исторический контент и provenance** — источники, права, trust mode, версия реконструкции.
2. **Published Spatial Package** — единый машиночитаемый пакет объекта.
3. **GLB asset pipeline** — одна версия модели для 3D / AR / VR.
4. **Field verification** — обмеры, контрольные точки, device matrix, persistent anchor gate.
5. **Interaction Physics** — единые press/drag/snap/haptic/transition правила.
6. **City experience** — карта, прогулки, аудио, offline, личные открытия, RU/EN.

Ключевой UX-стандарт: `docs/MOSCOW_INTERACTION_PHYSICS_V1.md`.

## Текущий технический контур

- Expo / React Native
- iOS + Android
- TypeScript
- ViroReact для 3D / AR / Quest VR
- React Native Gesture Handler + Reanimated/Worklets для прямого управления и прерываемой анимации
- Expo Haptics для семантической тактильной обратной связи
- Yandex MapKit для нативной карты пилота
- offline/content слой для маршрутов и пространственных пакетов

## Interaction Physics

Интерфейс рассматривается как физическая среда, а не набор экранов.

Обязательные правила:

- отклик начинается в момент `press-in`;
- drag следует за пальцем 1:1;
- spring/easing применяется только после release;
- любую анимацию можно прервать и развернуть;
- карта → место → время → 3D → AR → VR сохраняют пространственный контекст;
- haptics сообщает смысловое состояние, а не украшает интерфейс;
- reduced motion и outdoor accessibility являются частью acceptance criteria.

Reference primitives:

- `src/ui/PhysicalPressable.tsx`
- `src/ui/PhysicalSheet.tsx`
- `src/ui/TimeMachineSlider.tsx`
- `src/ui/interactionPhysics.ts`
- `src/ui/haptics.ts`

## Первый пилот

**Варварка — Зарядье.**

Цель пилота — не количество объектов, а законченный опыт одной прогулки:

**карта → место → исторический источник → машина времени → 3D → AR → VR/portal → личная коллекция → следующий объект.**

Первый reference object — **Палаты бояр Романовых**. Второй объект для доказательства повторяемости — **Старый Английский двор**.

## Статус

Репозиторий является единой точкой разработки приложения Moscow. Веб используется только как QA/demo preview той же React Native кодовой базы; отдельный сайт как продукт не развивается.

См. также:

- `docs/PRODUCT.md`
- `docs/ROADMAP.md`
- `docs/AR_VR.md`
- `docs/MOSCOW_INTERACTION_PHYSICS_V1.md`
- `docs/GITHUB_TECH_RADAR_AND_CITY_PRODUCT.md`
- `docs/CITY_HERITAGE_INTEROPERABILITY.md`
- `docs/CITY_HERITAGE_STUDIO.md`
- `docs/GOVERNMENT_PILOT_ACCEPTANCE.md`
- `docs/NATIONAL_TOURISM_PLATFORM.md`
- `docs/GOVERNMENT_SCALE_AND_FUNDING.md`
- `docs/LOCALIZATION_AUTHORITY.md`


## Текущая продуктовая фаза

После формирования пользовательского Varvarka flow приоритет смещён с расширения consumer-функций на доказательство и поставляемость:

1. Romanov physical field proof;
2. Old English Court как второй независимый spatial object;
3. City Heritage Studio как authority публикации;
4. supervised Varvarka user pilot;
5. government-ready evidence / acceptance package.

До фактического прохождения physical release gate production candidate не описывается как field-verified.


## Масштабирование за пределы Москвы

Москва является первым reference destination, а не жёстко зашитой границей продукта. Общий `DestinationPackage` описывает региональные туристические сущности, маршруты, booking handoff и явно маркированные коммерческие размещения. В текущем reference package опубликованы только уже source-backed точки Варварки; рестораны, live events, гостиницы и бронирование не подменяются демонстрационными данными до подключения authority providers.

Целевая последовательность: `Moscow proof → Moscow destination journey → external region → interregional route → federal interoperability`. Федеральная стратегия не предполагает дублировать Russpass или «Путешествуем.рф»; продукт развивает live journey + historical immersion layer и должен интегрироваться с существующей туристической инфраструктурой.


## Языки

Публичный продукт имеет три обязательные локали: `ru`, `en`, `zh`.

**Русский — master/default и основной редакционный язык.** English и 中文 обязательны для публичной публикации destination. `DestinationPackage` не получает publishable status без полной EN/ZH локализации, а перевод не может менять provenance, trust-classification, rights или field-verification state.

Human audio master проверяется отдельно для каждой обязательной локали; TTS остаётся функциональным fallback, а не подменой production recording.
