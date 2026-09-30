# YCLIENTS provider mapping v1

This document records the concrete mapping used by Moscow for the first provider candidate.

## Official interface

API base: `https://api.yclients.com`.

Moscow uses YCLIENTS only as a booking/provider authority. No claim is made that YCLIENTS is a city tourism or heritage authority.

## Booking record mapping

| YCLIENTS field | Moscow meaning |
| --- | --- |
| `id` | providerEntityId |
| `last_change_date` | provider observed/change time |
| `deleted` | cancelled/closed booking state |
| `attendance` / `visit_attendance` | booking/visit outcome signal |
| `confirmed` | provider-side confirmation signal |
| `online` | provenance attribute only; not used as success |
| `prepaid_confirmed` | payment-related provider attribute; not mapped to revenue |

## Webhook mapping

Only `resource=record` is accepted as booking receipt evidence.

`resource_id` becomes the provider entity ID. `status=create|update|delete` is preserved in the receipt identity. The provider timestamp must come from provider data such as `last_change_date` or `datetime`; Moscow does not substitute local receive time when provider time is absent.

## Truth boundary

A webhook delivery proves that Moscow received a provider event. It does not by itself prove payment, revenue, physical attendance or citywide impact.

Real admission still requires an authorized YCLIENTS company/test company, credential evidence and an actual webhook delivered to the Moscow endpoint.
