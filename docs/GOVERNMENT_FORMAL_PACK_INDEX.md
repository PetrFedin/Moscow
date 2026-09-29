# Government Pilot Pack — Delivery Index

## Для первой встречи

### 1. Executive

`docs/GOVERNMENT_EXECUTIVE_ONE_PAGER.md`

Для:

- руководителя;
- sponsor / task owner;
- первого ознакомления.

Содержит:

- предмет предложения;
- pilot scope;
- что уже реализовано;
- что не доказано;
- что требуется от Москвы;
- что получает город;
- scale path.

### 2. Live demo

В приложении:

**CITY PILOT**

Разделы:

- Пилот;
- Доказательства;
- Что нужно;
- Финансирование;
- Пакет;
- Заявка;
- Решение;
- Масштаб.

## Для перехода к официальной заявке

### 2A. Moscow Pilot Application Readiness

`docs/MOSCOW_PILOT_APPLICATION_READINESS.md`

В приложении:

`CITY PILOT → Заявка`

Deep link:

`?cityPilot=application`

Показывает отдельно:

- готовые project fields;
- project drafts;
- applicant-owned corporate/financial fields;
- legal review;
- external Moscow/site confirmation;
- missing formal attachments.

Application readiness не является подтверждением eligibility или присвоенного статуса участника.

Machine-readable check:

```bash
npm run government:application-readiness -- --text
```

## Для согласования пилота

### 3. Техническая спецификация

`docs/GOVERNMENT_PILOT_TECHNICAL_SPECIFICATION.md`

Для:

- product/business owner;
- technical owner;
- pilot operator;
- procurement/contract preparation.

### 4. Acceptance

`docs/GOVERNMENT_PILOT_ACCEPTANCE.md`

Для:

- buyer;
- pilot operator;
- technical acceptance;
- final report.

### 5. Methodology

`docs/PILOT_RESEARCH_PROTOCOL.md`

`docs/PILOT_OPERATIONAL_PACK.md`

Для visitor research.

## Для IT / Architecture / Integration

### 6. Buyer architecture

`docs/GOVERNMENT_BUYER_ARCHITECTURE.md`

### 7. Integration stack

`docs/INTEGRATION_STACK.md`

### 8. Live destination

`docs/LIVE_DESTINATION_AUTHORITY.md`

`docs/MOSCOW_LIVE_PROVIDER_STRATEGY.md`

## Для ИБ / данных

### 9. Security / data-flow

`docs/GOVERNMENT_SECURITY_DATA_FLOW.md`

Важно:

это readiness note, а не security certificate.

## Для legal / procurement

### 10. IP / rights / handover

`docs/GOVERNMENT_IP_RIGHTS_HANDOVER.md`

### 11. Source / publication authority

`docs/PUBLISHED_SPATIAL_PACKAGE.md`

`docs/CITY_HERITAGE_STUDIO.md`

## Для operations

### 12. Operations / SLA

`docs/GOVERNMENT_OPERATIONS_SLA_DRAFT.md`

Numeric production SLA targets остаются TBD до выбора hosting/support scope.

## Для инвестора / второго этапа

### 13. Investment / scale decision

`docs/PILOT_INVESTMENT_DECISION.md`

Показывает:

- proof readiness;
- governance readiness;
- measured economics readiness;
- district arithmetic only after real inputs.

### 14. Moscow → federal strategy

`docs/GOVERNMENT_INVESTOR_DEMO_2026.md`

`docs/GOVERNMENT_SCALE_AND_FUNDING.md`

## Для закрытия пилота

### 15. Final report template

`docs/GOVERNMENT_FINAL_PILOT_REPORT_TEMPLATE.md`

## Machine-readable readiness

Command:

```bash
npm run government:readiness
```

Authority:

`src/government/governmentDeliveryManifest.ts`

## Единственный formal artifact, который остаётся отдельной задачей

**10–12 slide decision deck.**

Он должен быть создан как настоящий presentation artifact, а не отмечен готовым на основании markdown outline.

## External evidence, которое документы не заменяют

- Romanov physical field proof;
- Old English Court repeatability;
- visitor pilot 20–50;
- formal provider integration;
- measured economics;
- first external region proof для федерального stage.
