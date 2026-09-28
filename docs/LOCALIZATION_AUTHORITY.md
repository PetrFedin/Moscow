# Языковая authority — RU / EN / ZH

Дата: 2026-09-26.

## 1. Обязательные языки

Публичный продукт поддерживает три обязательных языка:

1. `ru` — русский;
2. `en` — английский;
3. `zh` — китайский, упрощённое письмо.

Русский является:

- языком холодного старта;
- основным редакционным языком;
- master-языком исторического содержания;
- языком, на котором создаётся исходное утверждение до локализации.

Пользователь может явно переключить язык:

`RU → EN → 中文 → RU`.

Выбор сохраняется локально.

## 2. Publication gate

Для `DestinationPackage`:

- `primaryLanguage` обязан быть `ru`;
- русский обязателен структурно;
- английский и китайский обязательны для публичной публикации;
- отсутствие EN/ZH не делает рабочий draft невалидным, но делает его непубликуемым.

Это позволяет региону готовить материал поэтапно, не выдавая неполную локализацию за production-ready destination.

## 3. Что должно быть локализовано

Для публичного туристического пути обязательны RU/EN/ZH:

- название destination;
- объекты;
- маршруты;
- навигация;
- пользовательские статусы;
- Nearby;
- планировщик;
- offline;
- walk companion;
- транскрипты;
- исторические периоды;
- trust/evidence labels;
- 3D hotspots;
- публичный AR/spatial shell;
- commercial disclosure;
- booking-facing copy, когда booking provider будет подключён.

## 4. Что перевод не может менять

Локализация не является новой historical authority.

Перевод не может самостоятельно изменить:

- `documented`;
- `reconstructed`;
- `hypothesis`;
- source id;
- source rights;
- claim binding;
- model binding;
- field-verification state;
- review result;
- commercial/editorial separation.

Если перевод меняет смысл исторического утверждения, это новая редакционная версия и она должна пройти review.

## 5. Имена собственные и топонимы

Русское официальное/редакционно утверждённое название является master-value.

EN/ZH могут содержать:

- устоявшееся международное название;
- перевод;
- транслитерацию;
- поисковый alias.

Но stable object id не зависит от языка.

Следующий schema slice должен отдельно поддержать searchable aliases, чтобы иностранный турист находил объект по привычной форме названия без изменения authority title.

## 6. Китайский

Базовая китайская версия использует упрощённые иероглифы.

Китайский текст должен быть самостоятельной локализацией для путешественника, а не буквальной машинной калькой с русского.

Для исторического контента необходимо сохранять:

- даты;
- персоналии;
- различие между фактом и реконструкцией;
- смысл источника;
- отсутствие новых недоказанных утверждений.

## 7. Аудио

Язык интерфейса и production audio — разные gates.

Для каждой остановки обязательны:

- RU narration script;
- EN narration script;
- ZH narration script.

TTS разрешён как функциональный fallback.

Production human audio требует отдельно для каждой локали:

- approved master URL;
- safe filename;
- SHA-256;
- duration;
- narrator credit;
- rights evidence.

Поэтому наличие работающего `zh-CN` TTS не означает, что китайский human master production-ready.

## 8. Offline

Offline pack хранится отдельно по locale.

Если конкретный общий asset не имеет языковой зависимости, он reuse.

Если локализованный asset отсутствует, fallback определяется явно.

Для китайского общие non-language assets могут fallback к русскому master pack; устаревшие цены, live events и availability никогда не должны становиться «офлайн-актуальными» только из-за fallback.

## 9. Public vs field tools

Публичный туристический spatial experience обязан быть RU/EN/ZH.

Инженерные экраны:

- survey;
- calibration;
- residual capture;
- evidence transfer;
- persistent-anchor diagnostics;

являются внутренними field tools и не считаются частью публичной туристической локализации.

В публичном `MoscowExperienceApp` field tools должны быть скрыты.

Для #36 они включаются отдельным инженерным режимом.

## 10. Аналитика

Язык является допустимым агрегированным измерением пользовательского пути:

- `ru`;
- `en`;
- `zh`.

Это позволяет в supervised pilot увидеть различия UX по языкам без GPS-history, device identity или персональных данных.

## 11. Требование для регионов

Первый внешний регион (#43) не считается полностью public-ready, пока его `DestinationPackage` не проходит:

`RU primary + EN complete + ZH complete`.

Это правило одинаково для Москвы и любого следующего субъекта.

## 12. Следующие шаги

После базовой RU/EN/ZH authority:

1. language-specific content review roles;
2. searchable transliteration/aliases;
3. locale-aware dates, units and address formatting;
4. provider-localized booking handoff;
5. professional human audio masters;
6. terminology dictionary для истории/архитектуры;
7. QA на реальных устройствах с китайской системной типографикой;
8. user pilot по языковым когортам.
