# IP / Rights / Handover Matrix — Moscow Pilot

Статус: proposed commercial/legal baseline для обсуждения с заказчиком.

Это не юридическое заключение.

Финальные права, лицензии, территории, сроки и способы использования фиксируются в договоре.

## 1. Цель

Сделка должна одновременно обеспечить:

1. городу — долгосрочное использование оплаченного результата и переносимость данных;
2. проекту — возможность продолжать развивать reusable platform и масштабироваться на другие регионы;
3. правообладателям — соблюдение ограничений исходных материалов.

Нельзя автоматически считать, что «оплата пилота» передаёт заказчику все права на весь pre-existing platform IP.

## 2. Категории результата

| Категория | Пример | Предлагаемый baseline | Handover |
|---|---|---|---|
| Pre-existing platform IP | generic contracts, Studio workflow, validators, client framework | остаётся platform IP исполнителя; заказчику — договорная лицензия в согласованном объёме | source/binary/API/schema — согласно договору |
| Project-specific configuration | Varvarka route config, Moscow object mapping | право использования городом; ownership/license согласовать | editable/exportable config |
| Commissioned historical text | approved Moscow-specific copy | ownership/license согласно заказу и авторским договорам | source text + versions |
| Commissioned 3D | Romanov/OEC deliverable | права должны позволять согласованные city channels и дальнейшую эксплуатацию | exact GLB + source files if contracted + rights evidence |
| Third-party archival media | museum/archive/Commons | только в пределах исходной лицензии/согласия | source ref + rights terms; не передавать больше прав, чем есть |
| Audio masters | narrator/master files | права на запись/голос/музыку фиксируются отдельно | WAV/masters + transcripts + rights evidence |
| Survey/field evidence | control points, observations | заказчику доступ к evidence, достаточный для проверки/повторного использования по договору | structured files + methodology |
| PublishedSpatialPackage | versioned heritage package | переносимый результат проекта | machine-readable package + checksums |
| App binaries | iOS/Android pilot | право использования в scope договора | signed/release artifacts по модели distribution |
| Source code | repository/codebase | отдельно согласуемый объём; не подразумевается автоматически | source delivery/escrow only if contract requires |
| Live provider data | RUSSPASS/other feed | определяется provider terms; проект не передаёт чужие права | normalized/export only where permitted |
| Aggregate pilot reports | cohort/final study outputs | заказчику результат пилота | JSON/report + methodology |
| Raw recruitment/consent records | outside app analytics | владелец/оператор исследования по согласованному protocol | отдельно от product analytics |

## 3. Рекомендуемая коммерческая граница

Для масштабируемой модели разумный baseline:

### Platform core

Reusable platform/domain code remains reusable by the supplier.

City receives:

- contractual use rights;
- documented interfaces;
- exportability;
- access to agreed deliverables;
- no dependence on hidden unverifiable status.

### City-specific deliverables

For paid Moscow-specific production, contract should explicitly define:

- ownership vs license;
- term;
- territory;
- permitted channels;
- modification rights;
- sublicensing where necessary;
- museum/education/public-display use;
- commercial/tourist use;
- archival retention.

### Data portability

Even when platform core remains vendor IP, city should receive portable project data:

- sources registry;
- rights statuses;
- claims;
- reconstruction mappings;
- published packages;
- exact model binaries;
- evidence;
- approved copy;
- analytics reports;
- provider mappings where licensing permits.

This reduces vendor lock-in without requiring transfer of all reusable core IP.

## 4. 3D rights requirements

Before an external GLB can become publishable:

- contractor identity;
- commissioning/assignment/license basis;
- embedded third-party assets list;
- texture/font/material rights if relevant;
- publication/reuse permission;
- exact model/version/checksum binding.

An artist invoice alone is not treated as complete rights evidence unless the contract gives the required rights.

## 5. Historical sources

For each source:

- source ID;
- owner/institution;
- URL/archive ref;
- access date;
- rights status;
- allowed use;
- required attribution;
- restrictions;
- evidence reference.

`review-required` must not silently become public-cleared.

## 6. Audio / likeness / performer rights

Production audio must separately cover where applicable:

- script;
- narrator performance;
- sound recording;
- music/SFX;
- editing/master;
- languages;
- term/territory;
- digital/public use.

TTS fallback does not satisfy production master rights/readiness.

## 7. Provider data

Provider integration must preserve:

- provider attribution;
- source URL;
- provider ID;
- restrictions on caching;
- permitted retention;
- redistribution rules;
- booking deep-link rules.

A city contract with this project cannot grant rights that belong to an external provider.

## 8. Source code / escrow options

Possible contract models:

### License model

- core remains supplier IP;
- city receives runtime/use/support rights;
- schemas/exports guaranteed.

### Source delivery for specific modules

- selected source delivered;
- rights for modification/support agreed.

### Escrow

- source released under defined continuity events.

The commercial choice is separate from pilot evidence.

## 9. Handover package at pilot close

Subject to rights, minimum expected handover:

1. final approved content;
2. source/rights registry;
3. published heritage packages;
4. model binaries/checksums;
5. agreed editable production files;
6. audio masters/transcripts;
7. field evidence;
8. user-study aggregate outputs;
9. technical configuration;
10. interface/schema documentation;
11. final pilot report;
12. outstanding-rights list;
13. dependency/provider list;
14. environment/secret handover procedure without putting secrets in documents.

## 10. Handover acceptance

Handover is complete only when:

- files open/validate;
- versions/checksums match;
- rights scope is documented;
- missing/restricted artifacts are explicitly listed;
- buyer can identify which parts are city-specific and which are licensed platform dependencies.

## 11. Exit / continuity

Contract should define:

- data export on termination;
- content/model retention;
- removal of revoked third-party content;
- provider credential revocation;
- support transition;
- source/escrow conditions if applicable.

## 12. Open legal decisions before contract

- pre-existing IP schedule;
- city-specific IP ownership/license;
- editable 3D source-file requirement;
- source-code/escrow scope;
- third-party rights;
- use of city trademarks/logos;
- provider data licensing;
- personal-data roles if production account features appear;
- governing procurement/contract form.

No repository document replaces counsel/buyer legal approval.
