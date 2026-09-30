# Moscow Destination Journey Runtime + Provider Sandbox Contract v1

## Product transition

Moscow is no longer modeled as a list of recommendations. The runtime models one actual day:

`planned → live verified → executing → replanned when authority changes → executed → outcome evidence`.

Reference sequence:

`morning → heritage → AR → museum → lunch → event → evening`.

## Runtime rules

A live block cannot start until its current provider state has been verified.

When provider authority reports `closed`, `cancelled`, `sold-out`, `stale` or provider error for a future/current block:

1. that block becomes blocked;
2. journey state becomes `replan-required`;
3. the application may not invent a replacement;
4. a new plan is accepted only with a routing proof reference;
5. planVersion increments and the change remains in the audit log.

Completed blocks are historical fact and are not rewritten by later provider changes.

## Provider Sandbox Contract

Every provider enters Moscow through the same contract:

- provider identity and capabilities;
- source URL;
- refresh policy;
- snapshot envelope;
- normalized LiveDestinationEntity output;
- optional provider receipt normalizer for booking/ticket outcomes.

Provider-specific payload formats remain inside adapters. Consumer UI and Journey Runtime depend only on normalized contracts.

## Booking boundary

Opening a provider URL is a handoff, not a booking result.

A booking/ticket outcome is provider-confirmed only when the adapter can normalize a provider receipt containing:

- provider ID;
- receipt ID;
- handoff ID;
- provider entity ID;
- confirmed/rejected/cancelled/expired outcome;
- provider timestamp;
- evidence reference.

## Integration candidates

The same adapter contract can be used for a city tourism feed, RUSSPASS-style feed, museum/ticket operator, restaurant reservation partner or event source. No provider is claimed to be integrated until a formal feed/sandbox is actually connected.

## Next production proof

1. connect one real sandbox/provider;
2. ingest snapshots through existing Live Provider Ingestion;
3. build a day with at least one live block;
4. invalidate that block with real provider evidence;
5. obtain verified routing replacement;
6. continue execution;
7. obtain one provider receipt;
8. archive complete journey audit + outcome evidence.
