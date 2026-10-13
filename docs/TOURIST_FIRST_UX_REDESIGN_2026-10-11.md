# Moscow tourist-first interface — UX redesign v1

Status: candidate awaiting exact-head CI and browser/mobile proof.

## Observed problem
The first screen stacked Citywide Planner, heritage route, Nearby Now, free-walk builder, historical site list and a detailed evidence card. The bottom navigation used only very small labels. Day Composer exposes seven operational counters (FIXED/FLEX/TICKET/RESERVE/FREE/TRAVEL/CONFLICT) before the actual itinerary. These patterns make the experience resemble a diagnostics console rather than a visitor guide.

## Implemented in this branch
- Visual Moscow entry with a hero, one principal CTA, thematic discovery cards and a personal history preview.
- Single horizontal row of thematic cards with functional shortcuts; cards do not claim unverified current availability.
- Technical planning/heritage/nearby components retained under an explicit 'More routes and planning tools' disclosure.
- Source-based place details remain openable via first discoveries and the existing experience cards.
- Persistent bottom navigation gets recognizable icons and larger readable labels.
- The two independent AR field proof and external provider admission gates remain unchanged.

## Next scope
- PersonalTrip progressive disclosure: Today + day itinerary first; bookings, settings, composer evidence and diagnostics only when needed.
- Convert seven Day Composer operational counters into user-facing actionable warnings; do not hide real time conflicts.
- Work through the test suite and 375px mobile/768px tablet/desktop viewport QA, including screenshots.
- Actual production deployment must be explicitly proven with commit SHA and browser evidence.

## Source media
Hero imagery is credited to Wikimedia Commons in the component. Verify image URL, legal attribution and offline fallback before release; never present externally fetched media as already hosted by Moscow.

## Acceptance
Tourist should find 'Plan my trip' from the first viewport, start a route in two interactions, and reach saved places and trips via understandable navigation without encountering internal proof vocabulary.
