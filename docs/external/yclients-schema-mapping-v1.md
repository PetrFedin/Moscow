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

`resource_id` becomes the provider entity ID. `status=create|update|delete` is preserved in the receipt identity. Provider timestamps such as `last_change_date`, `create_date`, `datetime` or `date` are preferred. Because YCLIENTS documents partial `update/delete` webhook examples that may omit these fields, the receiver may use its own observed-at time only as webhook-delivery observation time. It must not be described as a provider-side change timestamp.

## Truth boundary

A webhook delivery proves that Moscow received a provider event. It does not by itself prove payment, revenue, physical attendance or citywide impact.

Real admission still requires an authorized YCLIENTS company/test company, credential evidence and an actual webhook delivered to the Moscow endpoint.
