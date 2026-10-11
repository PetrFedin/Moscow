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
