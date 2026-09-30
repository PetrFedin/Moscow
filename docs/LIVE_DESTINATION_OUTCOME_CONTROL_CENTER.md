# Live Destination Outcome Authority + City Journey Control Center v1

## Цель

Замкнуть пользовательский путь после heritage-слоя:

`heritage → live city → booking handoff → provider-confirmed outcome`.

Система специально разделяет app-observed действия и provider-confirmed результат.

## Authority layers

1. **Published heritage authority** — исторический маршрут и spatial package.
2. **Live Destination Authority** — только fresh operational projection.
3. **App aggregate evidence** — старт journey, завершение heritage, открытие live entity, открытие handoff.
4. **Provider receipt evidence** — единственный источник для утверждения об успешной брони/покупке.
5. **Ingestion audit** — snapshot/source/checksum/freshness trace.

## Fail-closed правила

- handoff click не равен booking success;
- stale entity не имеет live operational status;
- availability не выводится из наличия booking URL;
- revenue не выводится из handoff/booking count;
- booking success требует `provider-receipt-aggregate`;
- citywide impact не выводится из пилотного потока.

## City Journey Control Center

Government demo получает отдельный operational screen, показывающий:

- подключён ли provider;
- есть ли fresh live entities;
- сколько provider feeds имеют ingestion audit;
- есть ли только handoff или provider-confirmed booking outcome;
- какие outcome metrics измерены;
- какие gates остаются незакрыты.

До подключения реального городского/партнёрского feed экран должен показывать blocked state, а не demo truth.

## Следующий production gate

Подключить формальный provider sandbox/feed, сохранить реальные ingestion records, прогнать один полный Moscow Destination Journey и получить первый provider receipt evidence.
