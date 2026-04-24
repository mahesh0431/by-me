# PLANS

## Background

The `/blog` page is moving from a normal post listing into a more expressive, character-driven page.

The goal is not just to place the Snake Man sprite on top of the content. The goal is to make the blog page itself react to Snake Man's movement. The current direction is a click-triggered bounce sequence where the final infinite loop phase becomes the motion trigger: Snake Man should travel in a straight vertical line from the bottom-center resting position toward the upper blog post area.

As the sprite moves through the blog content, nearby post text should reflow around the visible sprite shape so the effect feels like the text is hugging the character, not avoiding the transparent PNG rectangle. This should use `@chenglou/pretext` for line-by-line text layout and a lightweight canvas/alpha-hull helper to derive the sprite silhouette from the PNG frames.

This work is scoped to `/blog` only.

We want to use [`@chenglou/pretext`](https://github.com/chenglou/pretext) only for the `/blog` page because it gives us low-level text measurement and manual multiline layout. That is the missing primitive we need if the content is going to adapt to a moving sprite silhouette at an atomic level instead of behaving like a normal DOM list.

The rest of the site should stay stable while this is built.

Current baseline:

- [x] `/blog` is slightly wider than the default site content width
- [x] `/blog` is grouped by year
- [x] Snake Man sprite is already present on `/blog`
- [x] Cleaned sprite PNG frames are available for the blog page animation
- [x] `@chenglou/pretext` is already wired into the blog-only scene

## Milestones

### Milestone 1: Lock Blog-Only Scope

- [x] Keep the effect limited to `/blog`
- [x] Leave `/`, `/blog/archive/`, and `/blog/[slug]` unchanged
- [x] Define the exact content that should react: title and description first, metadata stable unless needed later
- [x] Confirm the final baseline layout before pretext integration starts

Locked decisions for Milestone 1:

- `/blog` is the only route that gets the animated reflow experiment
- `/`, `/blog/archive/`, and `/blog/[slug]` keep their existing rendering and should not share the blog scene component
- The first reactive content pass is limited to each post title and description
- Year headings, dates, tags, navigation, and other page chrome stay stable unless a later milestone explicitly expands the scope
- The baseline layout before `@chenglou/pretext` starts is the current widened `/blog` page with year grouping, existing Snake Man placement, and the cleaned sprite PNG frames

### Milestone 2: Pretext Groundwork

- [x] Add `@chenglou/pretext`
- [x] Create a blog-only client scene component for `/blog`
- [x] Feed the current blog post data into that scene without changing the content source
- [x] Preserve a readable non-enhanced fallback for the page

Milestone 2 implementation notes:

- The new blog scene wrapper is scoped to `/blog` and does not affect other routes
- The server-rendered post list remains the readable fallback and current source of visible content
- The client scene now receives serialized year-grouped blog post data for future layout work
- `@chenglou/pretext` is wired into the blog-only client module, but no reactive text layout is applied yet

### Milestone 3: Atomic Text Layout

- [x] Replace normal flowing title and description text with pretext-driven layout
- [x] Precompute text measurement handles once and reuse them during motion
- [x] Lay out text line-by-line so available width can change while the sprite moves
- [x] Keep year group headings readable and stable while nearby post text adapts

Milestone 3 implementation notes:

- Blog post titles and descriptions now render through `prepareWithSegments()` plus `layoutNextLine()`
- Prepared title and description handles are created once per scene initialization and reused on resize re-layouts
- The rendered lines are stored as individual DOM spans so later milestones can vary line width and horizontal offset per row
- Year group headings, metadata, tags, and other stable blog chrome are left untouched

### Milestone 4: Snake Man Motion Model

- [x] Keep the normal idle sprite loop on `/blog`
- [x] Preserve the existing click-to-run animation start
- [x] Start straight-up movement only when the final infinite loop phase begins
- [x] Add a configurable motion target near the upper blog post area
- [x] Keep horizontal position stable while the sprite moves upward
- [x] Keep motion scoped to `/blog`

Milestone 4 planning notes:

- The sprite should not move upward immediately on page load
- The existing click-triggered animation remains the user action
- The final infinite bounce phase is the handoff point for vertical movement
- The first target is near the top of the visible post list, not the absolute top of the viewport
- A config parameter is acceptable if it keeps the motion distance/timing easy to tune later

Milestone 4 implementation notes:

- Sprite motion is configured in `src/lib/sprite-config.ts`
- The existing click handler still starts the frame sequence from the resting bottom-center position
- The final infinite loop still plays normally, and that phase now also starts the upward motion
- The upward motion uses a fixed horizontal center and a configurable top target based on `.blog-year-groups`
- The implementation remains blog-only because `SpriteRunner` is only mounted by `/blog`

### Milestone 5: Sprite Shape Detection

- [x] Load the relevant sprite frame image for shape analysis
- [x] Read visible pixels with canvas or `OffscreenCanvas`
- [x] Ignore transparent PNG padding
- [x] Build a smoothed alpha hull around the visible sprite body
- [x] Add enough padding so text feels natural instead of pixel-jittery

Milestone 5 planning notes:

- The effect should not use the full PNG rectangle as the obstacle
- The desired look is closer to the `@chenglou/pretext` dynamic-layout demo, where text hugs a smoothed visible-image hull
- For a demo-grade implementation, one representative hull can be used first; per-frame hulls can come later if the shape mismatch is obvious
- The hull should favor visual smoothness over exact pixel-perfect wrapping

Milestone 5 implementation notes:

- Sprite shape options live in `src/lib/sprite-config.ts`
- The first representative shape frame is frame index `8`, which is the first frame of the final infinite loop phase
- `src/components/blog/sprite-alpha-hull.ts` builds normalized alpha slices and polygon points from visible PNG pixels
- The helper uses `OffscreenCanvas` when available and falls back to a normal canvas
- The blog scene initializes the sprite hull, caches it with the scene state, and marks readiness with `data-blog-scene-sprite-shape`
- This milestone exposes shape data only; text avoidance still starts in Milestone 6

### Milestone 6: Content Reflow Around Moving Sprite

- [x] Turn the moving sprite hull into a layout exclusion zone
- [x] Recompute only nearby blog post title and description lines while the sprite passes through
- [x] Prevent overlap between the sprite hull and text
- [x] Keep metadata, year headings, navigation, and other page chrome stable
- [x] Restore normal layout smoothly when the sprite is no longer intersecting a post

Milestone 6 planning notes:

- `@chenglou/pretext` remains responsible for text preparation and line layout
- The canvas/alpha helper is only responsible for deriving the sprite shape
- The first reactive pass should stay limited to post titles and descriptions
- CSS-only `shape-outside` is not the preferred route because the sprite moves across separate blog post cards

Milestone 6 implementation notes:

- The blog scene maps the normalized sprite alpha slices onto the moving sprite rectangle in viewport coordinates
- Each title and description line checks whether its visual row intersects the sprite hull
- When the sprite blocks a row, the line uses the widest remaining text slot and receives a horizontal offset
- Cards outside the sprite hull neighborhood render with their normal full-width line layout
- A `requestAnimationFrame` loop runs while `data-motion-state="moving"` so text reflows during the upward transition
- The renderer now supports multiple fragments in one visual row, so text can occupy the left slot, skip the sprite hull, and continue in the right slot before moving to the next row
- Split rows now justify only the pre-sprite fragment when there is safe word-gap room, so normal line-wrap slack does not create a fake empty gap before the sprite

### Milestone 7: Random Wander And Return

- [x] Replace the straight-up motion with a bounded random path around the blog post area
- [x] Let the sprite move left, right, upward, and downward while the loop frames keep playing
- [x] Keep Pretext reflow active while the sprite wanders through post text
- [x] Return the sprite to the original bottom-center position after the wander
- [x] Restore the page to the normal non-reflowing state once the sprite returns

Milestone 7 implementation notes:

- The final infinite loop phase now starts a finite randomized waypoint path instead of a single vertical transition
- The sprite uses CSS transform variables for both X and Y movement, so the blog scene can keep reading the real `getBoundingClientRect()` position
- The path is bounded to the blog year-groups area with viewport safety limits
- When the path completes, timers stop, the first frame returns, motion state is cleared, and another click can start a fresh random run

### Milestone 8: Polish And Safety

- [ ] Tune the effect so it feels intentional, not chaotic
- [ ] Make sure the page stays readable during wandering movement
- [ ] Add a reduced-motion path
- [ ] Verify desktop and mobile behavior
- [ ] Final local route verification for `/blog`
