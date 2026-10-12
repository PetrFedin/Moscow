# Moscow city catalog admission — phase 1

Status: curated expansion backlog, NOT provider-verified availability or bookable inventory.
Depends on MOSCOW Companion OS PR #158 and Today branch.

## Source-backed candidates for editorial admission
- State Tretyakov Gallery — https://www.tretyakovgallery.ru/ (museum, exhibitions). Need venue-specific canonical ID, location, official hours, ticket and image rights verification before product release.
- Pushkin State Museum of Fine Arts — https://pushkinmuseum.art/ (art museum). Verify current branch/entry and source freshness.
- Bolshoi Theatre — https://bolshoi.ru/ (theatre). Performances, ticket supply and stage are date-specific; none is automatically available.
- Zaryadye Park — https://www.zaryadyepark.ru/ (park/cultural venue). Park access is not proof of access to all ticketed components.
- Gorky Park — https://parkgorkogo.ru/ (park). Individual activities have separate availability.
- Café Pushkin — https://cafe-pushkin.ru/ (restaurant). Do not invent table availability or pricing.

## Required admission fields
DestinationNode ID, canonical place name, venue/address/entrance, verified coordinates, kind, district, publisher and official source URL, checkedAt, publishedAt, validUntil for volatile fields, license and media rights, accessibility source, pricing truth status, ticket provider evidence and editorial owner. RU/EN/ZH translations verified independently.

## Release gates
1. Official site resolves to relevant venue and identity; record evidence with time.
2. Coordinates correspond to entrance, not approximate city center.
3. Validate rights/license for every photo.
4. Clearly distinguish manually added place from provider-confirmed reservation.
5. Include closed/temporarily unavailable and stale-data behaviors.
6. No scraping or API access without terms/quota review, no paid tier without approval.
7. Directory => detail => add to existing trip (user confirmation) => reload => map handoff end-to-end.
8. Every proposed place remains unreleased until these checks pass; do not count placeholder entries as live inventory.

## Implementation follow-up: City catalog + Today + privacy (2026-10-13)

PR #167 head is a stacked draft on PR #166. No merge or deploy is authorized from this document. The catalog currently offers seven editorial records: two museums (Tretyakov, Pushkin), Bolshoi Theatre, Zaryadye and Gorky parks, Café Pushkin and Voronezh restaurant.

- Official visitor / identity evidence for Tretyakov: https://www.tretyakovgallery.ru/for-visitors/museums/istoricheskoe-zdanie/
- Official visitor / main building evidence for Pushkin: https://www.pushkinmuseum.art/museum/buildings/main/index.php?lang=ru
- State institutional profile for Bolshoi historic stage and address: https://www.culture.ru/institutes/10218/gosudarstvennyi-akademicheskii-bolshoi-teatr-rossii-istoricheskaya-scena
- Official Zaryadye contact and address: https://welcome.zaryadyepark.ru/
- Official Gorky Park contact and entrance notes: https://parkgorkogo.ru/contacts/
- Café Pushkin official restaurant: https://cafe-pushkin.ru/ ; address appears in https://cafe-pushkin.ru/wp-content/uploads/2024/06/delovye-obedy.pdf
- Voronezh restaurant official site and address: https://voronej.com/

Checked source identity and address on 2026-10-13, NOT each venue's current admission, price, live business hours, cuisine changes, dining availability, official booking confirmation, photo usage rights or exact entrance geo coordinates. Display a checked *address* date, not a fake global "verified now" status.

### Stable trip link
A selected venue is persisted as `catalogPlaceId` + `officialSourceUrl` on the existing PersonalTrip item, with `source=manual`, no ticket or reservation object. Explicit user confirmation is required. Later genuine user-declared tickets or actual provider receipts must remain possible through a separate transaction. Duplicate insertion for the same day is rejected by canonical ID, with a fallback for prior snapshots which only stored a title.

### Browser/mobile QA
Visual acceptance must include 375/768/1440 images for Discover, curated directory details, chosen moment, trip creation and active Today. Automated browser tests must confirm canonical provenance and preservation after reload, restaurant type `food`, no invented reservation, and explicit reset confirmation before erasing local-only tickets or memories.

The public web export now hides pilot and WOW buttons unless demo is explicitly enabled, while institutional demo remains reachable through intended controlled entrypoints. True mobile device, scroll, accessibility and real provider checks remain separate OPEN gates. Desktop Discover is two columns; verify layout against real screenshot evidence and prevent content clipping.

### Known P0/P1 restrictions
Do not use venue photos without a license/rights registry. Do not assert open-now, distance, route minutes, exact venue entrance or available dining tables until provider/direction evidence is tested. External map handoff searches by address and is **not** a route proof. Do not claim full personal-trip cross-device backup: Local-first storage may be erased if user starts a new trip.

### User discovery and favorites (continuation)

A traveler can now select museums, theatre, parks or restaurants, filter categories, inspect dated address evidence, open the official venue page, search the address on an external map, bookmark a place in My Moscow, or explicitly add it to a day. A bookmark is not a visit; a planned venue is not a ticket; and an external map query is not a verified walking route.

Persist saved catalog IDs in the existing `moscow:v4:experience` snapshot with a category-specific validation set. This MUST NOT expand valid IDs for historical route stops, spatial experiences or visited evidence: only pilot IDs remain admissible to those subsystems.

On desktop Discover uses an editorial two-column layout; on phone and tablet the content remains stacked. The trip-reset control requires an explicit irreversible-deletion confirmation, because a local-only trip can contain user-declared tickets, acceptance receipts and private visit notes.

Automated QA includes today-active screenshots, catalog detail screenshots, formal visit vs favorites preservation, delayed booking separation, exact venue ID replay, and consented itinerary reset. No real-photo upload, restaurant reservation, new paid maps provider or provider-verified ticket has been implemented by these changes.
