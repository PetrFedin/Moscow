# YCLIENTS API / webhook capability evidence

## Sources checked

1. YCLIENTS support: API access  
   https://support.yclients.ru/67-68-199--dostup-k-api/

2. YCLIENTS REST API reference  
   https://yclientsen.docs.apiary.io/

3. YCLIENTS support: webhooks  
   https://support.yclients.ru/67-69-993--webhooks-v-yclients/

## Confirmed capabilities

### API authorization

The YCLIENTS REST API reference documents partner authorization as:

`Authorization: Bearer <partner token>`

Methods requiring user authorization additionally include:

`Authorization: Bearer <partner token>, User <user token>`

YCLIENTS support documentation also states that API access can use a system-user `User token` with permissions configured for the application.

### Record webhooks

YCLIENTS documents webhook notifications for booking records with:

- `resource=record`
- `resource_id` = record ID
- `status=create|update|delete`
- `data` = record data at the event

The record schema includes fields such as `date`, `datetime`, `attendance`, `visit_attendance`, `confirmed`, `deleted`, `create_date`, `last_change_date` and `api_id`.

Official examples show that update/delete webhook payloads may be partial. Moscow therefore preserves the exact raw payload SHA-256 and distinguishes a provider-side timestamp from the receiver's observed delivery time.

### Delivery caveat

YCLIENTS states that webhook delivery status is not stored/displayed for the customer and webhook retries are not performed. Moscow therefore must acknowledge quickly, keep its own evidence log, and archive the first proof immediately after receipt.

## What is not yet proven

This file documents public capability evidence only. It is not admission evidence.

Real #74 admission still requires:

- authorized partner/application access;
- partner token;
- user token if the selected API methods require it;
- authorized company/test company;
- successful real API call;
- actual YCLIENTS `record` webhook received by Moscow.
