# City Heritage Studio — минимальный контур публикации

## Назначение

City Heritage Studio — служебный контур подготовки и выпуска проверенного цифрового исторического объекта.

Он не является частью туристического интерфейса и не должен превращаться в публичную CMS. Его задача — обеспечить воспроизводимый процесс:

`объект → источники → права → утверждения → элементы реконструкции → модель → проверки → неизменяемая публикация`.

Публичное приложение, музейный экран, AR/VR и другие клиенты потребляют только опубликованный пакет.

## Что входит в v1

Текущая authority-модель реализована в:

- `src/studio/cityHeritageStudio.ts`;
- `tests/cityHeritageStudio.test.ts`.

В v1 поддерживаются:

1. создание черновика PublishedSpatialPackage;
2. последовательные ревизии;
3. историческая проверка;
4. правовая проверка;
5. техническая проверка;
6. запрос изменений с обязательным комментарием;
7. публикация только после трёх актуальных approvals;
8. разделение автора, проверяющего и публикатора;
9. неизменяемый snapshot каждой публикации;
10. audit sequence;
11. отдельные каналы `internal-preview` и `public`;
12. fail-closed правило для публичного spatial experience.

## Роли

### editor

Подготавливает draft package и открывает новую ревизию.

Не может утвердить собственную ревизию только потому, что одновременно обладает review-role.

### historian-reviewer

Проверяет связь:

`source → claim → reconstruction element`

и корректность trust-класса.

### rights-reviewer

Проверяет права на воспроизведение и публикацию источников и производных материалов.

Успешная геометрическая или AR-проверка никогда не заменяет rights clearance.

### technical-reviewer

Проверяет целостность пакета, model binding, versioning, runtime compatibility и необходимые technical gates.

### publisher

Выпускает уже одобренную ревизию.

Автор/последний редактор не может опубликовать собственную ревизию под той же identity.

## Состояния

`draft → in-review → approved → published`

или:

`in-review → changes-requested → draft(new revision)`

Каждая новая редактура после запроса изменений создаёт новую revision и обнуляет approvals предыдущей revision.

После публикации изменения не вносятся в snapshot. Для изменения объекта открывается следующая версия.

## Публичная spatial-публикация

Для package с:

`fieldVerification.required = true`

канал `public` запрещён, пока:

`releaseState !== field-verified`.

Поэтому Romanov production candidate может использоваться во внутренней проверке после очистки остальных publication blockers, но не может быть выдан за публично подтверждённую пространственную реконструкцию до реального field proof.

Это правило действует поверх:

`assertPublishedSpatialPackageCanPublish(...)`

и не заменяет проверку прав, структуры, источников или других blockers.

## Internal preview

`internal-preview` предназначен для:

- экспертной проверки;
- демонстрации рабочей версии городскому заказчику;
- музейной/редакторской приёмки;
- технического QA;
- подготовки полевого теста.

Internal preview не является публичной публикацией и не даёт права использовать формулировку `field-verified`.

## Audit

Каждая операция получает последовательный audit event:

- draft-created;
- draft-revised;
- review-submitted;
- review-approved;
- review-changes-requested;
- revision-opened;
- published.

Audit v1 хранится как append-only business contract внутри record.

При переносе Studio на серверный storage следующий обязательный шаг — физически отделить immutable audit/event store от editable draft-state.

## Что намеренно не входит в v1

Пока не нужны:

- сложный визуальный page builder;
- десятки типов workflow;
- произвольные роли;
- social collaboration;
- AI auto-publish;
- массовый импорт без review;
- отдельный rich-text CMS;
- автоматическое признание реконструкции достоверной.

Сначала нужен надёжный authority-cycle для Romanov и Old English Court.

## Следующий gate

После merge v1:

1. загрузить Romanov PublishedSpatialPackage в Studio как reference case;
2. провести полный review-cycle;
3. оставить публичный publish закрытым до физического Romanov field proof;
4. провести Old English Court через тот же workflow;
5. проверить, что второй объект не требует специальных object-specific исключений;
6. только после этого строить server persistence, UI Studio и institution accounts.

## Definition of Done v1

v1 считается закрытым, когда:

- domain tests зелёные;
- production candidate не может публично опубликоваться как spatial-verified;
- stale approval не переживает новую revision;
- author/reviewer separation проверяется;
- published snapshot не меняется вслед за working draft;
- повторная версия требует увеличения package version;
- Romanov и Old English Court могут использовать один и тот же workflow contract.
