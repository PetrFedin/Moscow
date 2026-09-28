# «Варварка во времени» — консолидированная техническая спецификация пилота

Статус: buyer-facing draft для согласования первого городского пилота.

## 1. Цель

Проверить воспроизводимый технологический и организационный контур цифрового исторического объекта и visitor journey на ограниченной территории Москвы.

Пилот не является citywide rollout.

## 2. Территория и объекты

Территория:

- Варварка;
- Зарядье;
- связанный пешеходный маршрут.

Контентный scope:

- 5 маршрутных точек;
- Палаты бояр Романовых — первый physical spatial proof;
- Старый Английский двор — second-object repeatability proof.

## 3. Пользовательский scope

Pilot build должен обеспечивать:

- Discover / nearby;
- маршрут;
- карточку исторического объекта;
- source/evidence distinction;
- Time Machine;
- audio + transcript;
- 3D;
- AR при наличии release authority;
- non-AR fallback;
- offline historical content;
- My Moscow / recap;
- RU / EN / ZH;
- accessibility controls, предусмотренные текущим product contract.

## 4. Не входит автоматически

Без отдельного согласования пилот не обещает:

- citywide catalog;
- production booking engine;
- payment processing;
- собственную замену RUSSPASS;
- live price/availability;
- статистически репрезентативное исследование Москвы;
- массовое VR-развёртывание;
- production SLA уровня городского критичного сервиса;
- федеральное внедрение.

## 5. Heritage authority

Для hero object требуется:

`source → rights → claim → reconstruction element → model version → metric authority → field evidence → published state`.

Ручной перевод объекта в field-verified запрещён.

Reference:

- `docs/PUBLISHED_SPATIAL_PACKAGE.md`;
- `docs/GOVERNMENT_PILOT_ACCEPTANCE.md`.

## 6. Romanov field proof

Минимальный release contour определяется действующим кодовым authority.

Buyer-facing acceptance включает:

- approved survey packet;
- 5 facade control points;
- 5 / 10 / 15 m;
- минимум 2 iOS;
- минимум 2 Android;
- минимум 12 complete device-distance sessions;
- alignment observations/residual evidence;
- calibration evidence;
- host continuity;
- persistent anchor evidence;
- independent resolve;
- restart/recovery proof согласно protocol.

Синтетические test fixtures не являются pilot evidence.

## 7. Old English Court repeatability

Второй объект должен иметь собственные:

- sources;
- rights;
- provenance mapping;
- real GLB;
- SHA-256;
- metric-scale evidence;
- control-point authority;
- survey;
- field sessions;
- release decision.

Romanov evidence не переиспользуется как substitute.

## 8. Visitor pilot

Целевой supervised sample:

- 20–50 участников.

Основная воронка:

`app open → route start → first stop complete → route complete → recap → continue`.

Qualitative observation:

- hesitation;
- route understanding;
- audio discoverability;
- documented/reconstructed distinction;
- voluntary feature use;
- early-stop reason;
- post-walk intent;
- outdoor/technical issues.

Протокол:

- `docs/PILOT_RESEARCH_PROTOCOL.md`;
- `docs/PILOT_OPERATIONAL_PACK.md`.

## 9. Analytics boundary

Pilot analytics:

- local-only;
- aggregate-only export;
- без raw GPS history;
- без email/phone/name;
- без advertising identifiers;
- без cross-report identity matching.

Recruitment/consent records хранятся отдельно от app analytics.

## 10. Live destination / integration

Пилот должен использовать provider authority:

`provider capability → snapshot → checksum → freshness → normalization → status/booking projection`.

Запрещено:

- считать directory record доказательством open now;
- показывать stale operational status как текущий;
- придумывать prices/availability;
- использовать undocumented scraped endpoint как production authority.

Reference:

- `docs/LIVE_DESTINATION_AUTHORITY.md`;
- `docs/MOSCOW_LIVE_PROVIDER_STRATEGY.md`.

## 11. City Heritage Studio

Минимальный workflow:

`draft → review → approvals → immutable publication`.

Roles:

- editor;
- historical reviewer;
- rights reviewer;
- technical reviewer;
- publisher/admin.

Revision invalidates stale approvals.

## 12. Платформы

Pilot scope:

- iOS;
- Android;
- web demo/QA preview.

Web preview не заменяет native field proof.

## 13. External SDK / provider dependencies

Текущий contour предусматривает:

- Yandex MapKit;
- ViroReact / ARKit / ARCore;
- optional persistent-anchor provider;
- official/provider tourism feeds после formal access.

Ключи и credentials не хранятся в репозитории.

## 14. Deliverables

### Product

- pilot mobile build;
- demo flow;
- route/content pack;
- hero object packages;
- Studio workflow.

### Evidence

- Romanov field bundle;
- OEC field bundle;
- user study report;
- accessibility/device QA;
- provider/integration evidence.

### Buyer package

- executive one-pager;
- acceptance matrix;
- architecture;
- security/data-flow;
- IP/handover;
- operations/SLA;
- economics;
- final report.

## 15. Acceptance

Backbone:

`docs/GOVERNMENT_PILOT_ACCEPTANCE.md`.

Acceptance is evidence-based.

A screen, demo video, GLB count or build completion cannot substitute required evidence.

## 16. Change control

Любое изменение, затрагивающее:

- historical claim;
- rights;
- model binary;
- metric authority;
- field protocol;
- provider semantics;
- analytics/privacy boundary;
- acceptance criteria;

должно быть versioned и отражено в соответствующем authority/evidence package.

## 17. Responsibilities to assign before start

Со стороны заказчика/площадки:

- city sponsor / task owner;
- pilot-site representative;
- heritage/content expert;
- legal/rights contact;
- IT/integration contact;
- security/data contact.

Со стороны исполнителя:

- product owner;
- technical owner;
- spatial lead;
- content/research lead;
- pilot research lead;
- operations owner.

Конкретные ФИО фиксируются в соглашении/плане пилота.

## 18. Exit criteria

Пилот завершён, когда:

- согласованные sessions/activities выполнены;
- evidence bundle собран;
- deviations зафиксированы;
- acceptance matrix заполнена;
- economics inputs измерены либо явно отмечены missing;
- final report показывает proven / not proven / blocked;
- сформирован отдельный decision pack для следующего этапа.

## 19. Цена и сроки

В этой спецификации не фиксируются произвольные суммы или сроки.

Коммерческая версия заполняется после подтверждения:

- реального объёма OEC production;
- survey;
- rights work;
- provider integration scope;
- hosting/security requirements;
- operations/SLA;
- production audio.
