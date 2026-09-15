# City Heritage interoperability

Цель: сделать «Москва во времени» не закрытым каталогом, в который всё загружается вручную, а потребителем и издателем проверенного культурного контента.

## 1. IIIF как предпочтительный архивный контракт

Для исторических изображений и рукописных/архивных источников в P1 поддержать IIIF Presentation/Image API как один из внешних ingestion contracts.

Почему:
- музей/архив сохраняет контроль над оригиналом;
- приложение получает стандартизованные изображения, размеры и метаданные;
- проще показывать crop/zoom без копирования тяжёлого master-файла;
- источники можно сравнивать и аннотировать;
- меньше ручного импорта при масштабировании на десятки учреждений.

Reference implementation / UX research: https://github.com/ProjectMirador/mirador (Apache-2.0).

Mirador не является runtime мобильного приложения. Мы используем его как reference для IIIF, сравнения изображений и annotation UX.

## 2. Минимальная карточка внешнего источника

Каждый источник должен иметь:
- stable source id;
- institution;
- title;
- creator/author;
- date or date range;
- original URL / IIIF manifest URL;
- rights / license;
- access date;
- checksum или version marker для локально сохранённого derivative;
- region/crop, если реконструкция использует не весь источник;
- редакторское примечание;
- historical state(s), которые источник подтверждает.

## 3. Связь source → reconstruction

Нельзя хранить только список литературы рядом с готовым GLB.

Нужна связь:

`source → claim → reconstruction element → model version`

Пример:
- Наидёнов, вид Варварки, 1883;
- claim: форма конкретного оконного проёма;
- element: `documented__window_east_02`;
- model: `romanov-1859-documented-v1`.

Так при изменении атрибуции можно понять, какие части модели требуется перепроверить.

## 4. Deep link / QR / NFC

Каждый опубликованный объект получает стабильный public URI/deep link:

`moscowintime://place/<place-id>`

Опциональные параметры:
- `era`;
- `scene`;
- `route`;
- `source`;
- `language`.

QR/NFC не должны содержать секретных или временных URL. Они открывают stable id, а приложение уже разрешает его в актуальный published package.

Городской сценарий:
- табличка на объекте;
- музейная витрина;
- школьное пособие;
- выставка;
- туристическая стойка;
- транспортная остановка.

Один QR может открыть короткую историю без установки приложения и предложить native spatial experience, если приложение установлено.

## 5. Institution publishing contract

В будущем учреждение культуры не должно отправлять разработчикам ZIP по почте.

City Heritage Studio публикует пакет:
- place metadata;
- historical states;
- source manifests;
- audio/subtitles;
- model pack;
- rights;
- trust classification;
- field calibration status;
- version;
- review approval.

Public app видит только immutable published version.

## 6. Что не смешивать

- архивный master и оптимизированный mobile derivative;
- documented и reconstructed geometry;
- rights ownership и historical confidence;
- public visitor metadata и internal restoration/inspection evidence;
- городской digital twin текущего состояния и историческую исследовательскую реконструкцию.

## 7. Следующий технический gate

После Romanov field verification создать минимальный `PublishedSpatialPackage` JSON schema и использовать его для второго объекта (Старый Английский двор). Если второй объект проходит тот же pipeline без специальных исключений, архитектуру можно считать повторяемой для пилотного района.
