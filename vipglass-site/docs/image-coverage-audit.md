# Image coverage audit — VIP Glass v7

Read-only audit of source at `eb336e5147373596469815dbe8cf0bef1fefff71` and its generated pages. Snapshot of the counting run: **2026-10-16 10:18 UTC**, before the concurrent rewrite of the partitions root to four `partition-entry-card` tiles. The root rewrite keeps the same 4 system targets and 38 subtype targets; the figures below are a baseline, not a claim about the unfinished replacement.

Implementation follow-up: the later catalogue resolver changes are recorded per URL in `catalog-image-mapping-changes.json`. This document retains the original findings and empty-card baseline; it must not be used as a count of remaining issues after that implementation.

No application code or tests were changed. Node VM rendering and local-file inspection only; no browser, server, layout or mobile interaction assessment.

## Finding

There are images on every catalogue/resource/hardware page, but most **choice cards deliberately suppress their image**. Separately, many available photographs do not match the property being selected. Simply turning images on will fix empty cards and reveal the mismatches more clearly.

Reviewed **93 full-size raster images** (excluding thumbnails and the logo) in seven contact sheets. The judgments below are based on the actual pictures, not filenames. Full-image details were inspected at contact-sheet scale; this is a semantic/type audit, not certification of the generated construction geometry.

## Exact empty-card baseline

All **1,268 canonical pages** rendered in the actual app VM. Their card target/role/image signatures matched the 1,268 corresponding static pages; the build also contains 299 alias HTML pages. Count each canonical page once, without filtered states or ordinary navigation/CTA links. An image elsewhere on the page does not count as an image inside a card.

| Destination | Card occurrences | Without img | Unique targets never pictured in any choice card |
|---|---:|---:|---:|
| Mirrors | 1,995 | 1,445 | 116 |
| Showers | 649 | 490 | 45 |
| Partitions | 16,103 | 13,000 | 307 |
| Doors | 161 | 111 | 10 |
| Stairs and railings | 1,048 | 771 | 46 |
| Canopies | 194 | 138 | 16 |
| Materials | 538 | 468 | 53 |
| Production | 1,893 | 1,842 | 82 |
| Hardware | 218 | 134 | 0 |
| **Total** | **22,799** | **18,399** | **675** |

All 675 never-pictured targets are final pages; each still has an image on its own page. This is not a count of missing files or of distinct new photos required.

**Main selection only**, excluding sibling/family repetitions and related recommendations: **2,346 cards, 1,767 without img**. The 20,453 repeated/related occurrences contain another 16,632 imageless cards. An additional 59 portfolio/editorial/portal cards all have images.

| Card role | Occurrences without img | Cause |
|---|---:|---|
| Primary variants | 1,729 | Duplicate-image detection switches the entire group to text |
| Partition root subcards | 38 | Text-only subtype anchors |
| Repeated family directory | 13,418 | `catalogDirectory` explicitly requests `card(child,i,false)` |
| Sibling alternatives | 1,122 | `optionsOnly:true` disables every sibling image |
| Related materials/processes | 1,958 | `resourceUI.related()` requests `card(n,i,false)` |
| Other hardware types | 134 | Separate text-only template rather than `typeCard()` |

## Rendering changes needed

1. `dist/catalog-directory.mjs`: remove the forced `false` for subtype cards. Keep the full linked card and existing hierarchy.
2. `dist/catalog-ui.mjs`: `choices()` must not turn every photo off because two siblings share one image. `optionsOnly` should control density/layout, not image presence. Apply the same rule to sibling and family cards.
3. `dist/resource-ui.mjs`: make `grid()` and `related()` consistently use image cards. An optional common reference picture cannot replace pictures in the choices.
4. `dist/hardware-ui.mjs`: render “Other hardware types” with the same illustrated `typeCard()` contract as the main type list.
5. `dist/partitions-ui.mjs`: subtype anchors need a thumbnail too, including the lists below/inside the four system entries.
6. Keep lazy loading and real `-480.webp` sources. Adding every photo while serving 1254-pixel originals to small cards would multiply transfers across the repeated family directories.

## Existing photographs: confirmed mismatches

### Partitions

458 pages currently resolve to only six photos: `partition-clear` 108, `partition-shop` 40, `partition-framed` 129, `partition-double-blinds` 1, `partition-loft` 140, `partition-smart` 40.

The actual clear and framed pictures show mostly fixed full-height boundaries. The loft image shows a hinged framed door with a rectangular grid. None shows a folded book, parked glass panels, a telescopic stack or a pivot leaf. The SMART image shows entire panels in milky/transparent states, not electronically segmented stripes.

The last line of `mediaForNode()` applies `n.imageKey` after its mechanism logic. Every new partition descendant carries a system imageKey, so it overrides the attempted sliding-image selection.

Of 309 partition leaves, **50 are glass options, 35 decor options and 12 privacy options**. They currently show room scenes. A glass sample or a close-up of the selected detail is the appropriate primary visual for these specification pages.

### Other construction categories

| Area | Actual mismatch | Action |
|---|---|---|
| Doors: 29 pages, two images | Both photographs show one leaf; paired doors and different leaf arrangements reuse them | Keep these for single swing/slide. Add a paired door photo/detail before claiming a paired arrangement is pictured |
| Showers: 77 pages, 11 images | Broad U/pentagonal/tub geometry wins before a deeper opening choice; a U folding option can show a hinged U enclosure | Resolve opening details as well as enclosure shape. A mechanism detail can supplement a context photo; do not silently call a niche photo a U enclosure |
| Showers `shower-telescopic` | The photo visibly shows a basic rail and overlapping sheets; synchronized telescopic movement is not established | Suitable for the sliding family; a true cascade/telescopic picture or mechanism detail is still needed |
| Mirrors `mirror-panel-geometric` | The photo is an arrangement of mixed round/oval/free shapes; its current alt claims a straight geometric layout | Use `mirror-panel-bevel` for a regular rectangular grid; reserve the mixed-shape photo for a matching free composition |
| Mirrors, lower shapes | Metal round can resolve to a brass round; aluminium always oval; wood always arched; frameless oval resolves to round | Do not let frame-family fallback contradict a named shape/material. Add missing shape/frame photos or use a truthful material/detail gallery; changing alt text alone does not fix the picture |
| Railings | One stair image with point fixing also illustrates profile/post variants; a landing image illustrates many different supports | Existing `stairs-glass` fits point-fixed stairs; `railing-landing`/`railing-outdoor` fit their locations. Post-supported and inclined base-profile railings need their own photo/detail |
| Canopies | Two basic fixing families are pictured correctly; all secondary plan shapes reuse rectangles | Retain both family photos; a trapezoid/complex outline still needs a matching result image if it is presented as the selected outline |

### Materials and production

| Exact target/type | Current image and visible problem | Appropriate mapping |
|---|---|---|
| Satin graphite, dark satin, full matte graphite, tempered satin graphite | `material-satin`: white/light frosted clear sample | New `material-satin-graphite` |
| `/materials/textured/textured-fluted/textured-fluted-graphite` | `material-fluted`: colourless ribbed sample | New `material-fluted-graphite` |
| Patterned bronze/gold | `material-patterned`: colourless pebble relief | Needs a tinted patterned sample; bronze ribbed is a different texture |
| Matte painted glass | `material-painted`: strongly glossy white/black/taupe samples | Needs a matte painted sample; existing photo is correct for glossy family |
| Curved bronze/graphite and curved tinted triplex | `service-bending`: colourless bent pane | Retain for clear bent glass, add tinted bent sample for the coloured choices |
| Photo/illustration printing | `material-marble-print`: a marble pattern | Use a printed image sample, not the stone texture |
| Printed graphics/logo/lettering | `material-clear`: completely blank clear glass | Requires a visible printed graphic/text sample |
| Decorative film choices | `material-patterned`: integral relief glass | Requires an applied-film surface/detail, not patterned glass |
| Mirror matting/engraving | `service-sandblast` and `service-engraving`: clear glass panels, not mirrors | Reflective mirror sample with matting / V-groove. A separate mirror base sample can supplement it |
| Production CNC | `service-drilling`: result with hole and notch | Existing `service-cutting` visibly shows a machine head over glass and is the stronger available process photo |
| Production rounding | `service-cutting`: machine head, no rounded finished corner | New rounded-corner result photo |
| Arrising vs polishing | Both `service-edge`: glossy polished edge | Use `service-grinding` for a ground-edge family, while noting a narrow arris is a different detail |
| Mirror light zones | `service-sandblast`: transparent glass band and circle | Existing `mirror-front-light` shows the actual resulting luminous mirror; a dedicated reflective sample is better for the process section |
| Laser engraving | `service-engraving`: visible mechanical V-grooves | Requires a laser-matted/raster or otherwise correct laser result sample |
| Screen printing | `material-painted`: solid opaque backpainted swatches | Needs visible printed dots/lines/pattern |
| Film application | `material-tinted`: three apparently bulk-tinted panes | A peel/application detail makes the difference visible |

Drilling/cutouts can share the existing hole-and-notch sample. Bending and bending-with-tempering can share the curved result: a photograph cannot establish thermal treatment. Similarly, clear annealed and clear tempered glass may honestly share a material sample when the treatment is stated in text. Do not generate fictitious visible differences for properties that are not visible.

### Hardware

Nine photos serve 34 items / 16 type IDs. These are illustrations, not verified photographs of named manufacturer models.

- `wood-glass-handrail` uses **a stainless-steel rail** (`hardware-handrail`): replace with wood-on-glass detail.
- `round-mirror-frame` uses **three straight U-profiles**: replace with an actual circular mirror frame.
- `mirror-light-profile` also uses plain U-profiles with no LED/diffuser: use a lighting channel detail.
- `shower-support-bar` uses **wall/corner clamps**, no bar: needs a stabilising-bar detail.
- `floor-glass-clamp` shows wall/edge clamps, not a floor support: needs the correct floor holder.
- Corner/inline glass hinges share a wall-to-glass hinge photo; exact connection geometry is not represented.
- The `Pauli` badge sits on generic generated hinge/standoff imagery. Keep it explicitly an illustration of a type until an approved picture of the actual named product is supplied.
- The slider photograph depicts an exposed round-rail mechanism. It does not establish corner, telescopic or concealed soft-close mechanisms. Those item pages need a correct mechanism detail or the actual supplier photo.
- The handle photo contains a knob and two pull handles, so it is a reasonable family cover. It is not a distinct photo for each handle variant.

There is **no lock item** in the current catalogue; the early tentative “hardware-lock” request was withdrawn and replaced with wood handrail. Do not generate an unused lock merely to increase asset count.

## First production batch: 12 images

These were sent to root for parallel generation. They address the most conspicuous current errors; they do **not** establish complete exact-variant coverage by themselves.

| New key | Concrete visible requirement | Exact primary mapping |
|---|---|---|
| `partition-allglass-telescopic` | Several neutral clear panels visibly offset on parallel paths | `systemId=all-glass && openingId=telescopic`; also a suitable telescopic detail for door sections |
| `partition-allglass-folding` | Frameless linked panes visibly folded in a pair | `all-glass && openingId=folding` |
| `partition-allglass-stacking` | Separate panes parked together at the side | `all-glass && openingId=stacking` |
| `partition-framed-sliding` | Thin framed sliding leaf, no loft grid, visibly displaced | `framed && openingId=sliding && glazingId!=double` |
| `partition-framed-double-clear` | Two independent rows in a frame, no blinds or sealed unit | `framed && glazingId=double && blindsId!=between-panes` |
| `partition-loft-sliding` | Framed/grid sliding leaves visibly overlap/shift | `loft && openingId=sliding`; not a substitute for a folded or pivot leaf |
| `partition-loft-folding` | Framed glass book visibly folded | `loft && openingId=folding` |
| `partition-loft-pivot` | Framed glass leaf rotated on an axial pivot | `loft && openingId=pivot` |
| `partition-smart-segmented` | Internal PDLC segments with alternating clear/milky zones, no mechanical slats | SMART segmented branch and matching `decorId=smart-horizontal`; vertical/zonal leaves need a matching detail rather than claiming this photo shows their exact pattern |
| `hardware-wood-handrail` | Wood rail and its actual glass connection | hardware ID `wood-glass-handrail` |
| `material-satin-graphite` | Neutral grey frosted sample | Four graphite/dark satin material leaves, plus matching partition glass options |
| `material-fluted-graphite` | Grey vertically ribbed sample | Graphite fluted material leaf and `ribbed + grey` partition options |

Keep clear glass neutral; intentional bronze/graphite is correct only on tinted options. Photos should show real object geometry without arrows, labels or printed pseudo-diagrams.

## Reuse existing samples now: exact resolver order

Resolve a **specific subject before the inherited system imageKey**. Do not replace every `decor-option` with a glass sample: loft frame material/colour/grid are frame choices, not glass colour.

For `modelKind=glass-option`, system other than SMART, and corresponding `/glass/...` branch covers:

| Condition | Existing/new asset |
|---|---|
| `decorId=ribbed`, colour clear / bronze / grey | `material-fluted` / `material-fluted-bronze` / new `material-fluted-graphite` |
| `decorId=full-matte` | `material-satin` (grey/bronze use matching tinted satin) |
| `decorId=sandblast` | `service-sandblast` |
| `glassTreatmentId=laminated` or `laminated-tempered` | `service-lamination` as the layer/edge sample |
| Material colour bronze | `material-bronze` |
| Material colour grey | `material-graphite` |
| Clear material, thickness, annealed or tempered sample | `material-clear` |
| Glass-colour branch overview | `material-tinted` |

For SMART glass options, retain a switchable-material sample (`material-smart`) as the technology view. A neutral sample does not show a chosen bronze/grey tint; show the corresponding tint sample as an additional material image or obtain a tinted SMART sample. Never substitute adhesive-film imagery for the internal PDLC layer.

Then resolve `blindsId=between-panes` to the existing `partition-double-blinds`, the new double-clear system, specific mechanisms, meaningful room context, and only finally the generic inherited system cover. `partition-shop` is a suitable shop context but must not overwrite a selected folding mechanism.

For existing decorated-glass families, `service-sandblast` proves partial matting and `service-engraving` proves V-groove work. Neither proves a specific logo, lower-only pattern or mirrored substrate. Use those as clearly identified detail illustrations alongside a correct base image until a matching sample exists.

`mediaAssets` currently assumes an interiors base directory. Add explicit `src`, `thumbnail`, `kind` (`interior`, `sample`, `detail`, `process`) metadata for reused production assets. `mediaForNode()` must respect a supplied thumbnail, and `photoMarkup()` must emit srcset for explicit sample paths too. The current `asset.src || ...` thumbnail fallback would otherwise load the full sample as its own thumbnail. Update gallery captions: a material sample must not be labelled “Интерьерная визуализация направления”.

## Remaining gaps after the first batch

A small reusable **second batch**, not hundreds of room images, can cover the next high-value types:

- Four hardware details: stabilising bar, floor holder, circular mirror frame, LED profile.
- Three production/results: rounded corner, laser-matted sample, printed pattern / screen-print sample.
- Three material/decor samples: matte backpainted glass, printed photograph on glass, film application detail.
- Two railing details: post-supported glass and inclined base-profile support.

That makes 24 new images over both batches. This still leaves exact lower-level variants such as mirror shape/frame combinations, tinted bent glass, double/paired door arrangements, loft grid patterns/finishes, SMART vertical segmentation and mirror engraving colours. Those must be listed as remaining semantic gaps, resolved with additional exact images or a truthful context-plus-detail gallery. **Do not report “all pictures correspond exactly” solely because every card now contains an img.**

## Acceptance gate after implementation

- Zero imageless choice cards in the main selection, directories, siblings, related processes/materials, root subcards and other-hardware types. Ordinary text navigation is excluded.
- Every image and thumbnail resolves to a nonempty local file.
- Every glass-option resolves to a material sample; frame options keep frame imagery; no all-purpose system override erases them.
- Sample semantic fixtures: grey satin is grey/frosted; grey fluted is grey/ribbed; a wood rail is wood; a round frame is round; a folding leaf is visibly folded; double glass is two independent rows; segmented SMART is electronic opacity without slats.
- Clean/hash routing, filters, selected presets and exports remain unchanged by presentation work.
- Run the VM count again on the final build. Browser/mobile layout remains unverified unless a supported browser becomes available.

## Audit evidence

Machine-readable reports and contact sheets are in `/workspace/scratch/e030de584a13/image-audit/`:
`card-report.json`, `card-supplement.json`, `card-occurrences.json`, `mapping.json`, `systems-1.jpg`, `mirrors-1.jpg`, `showers-1.jpg`, `materials-1.jpg`, `processes-1.jpg`, `hardware-1.jpg`, `global-1.jpg`.

`card-audit.mjs` reproduces the canonical-page/card count. These are audit working files, not site assets. The count report explicitly separates repeated cards from unique destinations.

## After implementation — 2026-10-16

The final VM audit includes **1,269 canonical pages**. All **22,799 selection-card occurrences** contain an image within their own link: **2,346 main choices** and **20,453 repeated or related choices**, serving **1,231 unique destination URLs**. There are **zero imageless cards** in these groups. Ordinary navigation links are excluded. These figures count card occurrences, not unique photographs. Evidence: `card-summary-vm-final.json`, `card-report-vm-final.json` and `card-occurrences-vm-final.json` in the `image-audit` working directory.

The catalogue resolver changed **346 node mappings**: 293 partitions, 36 stairs/railings, 10 showers and 7 mirror compositions. Every one of the **50 glass-option leaves** now resolves to a material sample. Colours, satin/ribbed textures, laminated edges and SMART samples take precedence over inherited interior covers. Frame/grid choices retain frame imagery. Folding, telescopic, stacking, framed sliding, loft motion and independent double-row glass have appropriate system illustrations. Wood handrail choices show a wooden rail detail. The regular mirror-grid family no longer shows unrelated circular and free-form pieces.

Sample and detail assets have explicit full-size and thumbnail paths, truthful alt text and gallery labels. Galleries no longer call a glass sample an interior photograph. The source/thumbnail/gallery-key assertions cover all 908 catalogue nodes; another 68 semantic fixtures cover motion and double-row configurations. Per-URL changes and remaining limitations are recorded in `catalog-image-mapping-changes.json`. Resource/hardware resolver work is documented separately by its implementation owner. The final shared asset existence/decoding gate runs after both photo batches finish.

Visual review confirmed the first 12 new subjects from actual local images; the additional printed-photo sample was also viewed. New imagery is generated illustration, not a photograph of a completed VIP Glass project or a certified product model. Full-size loft-folding was repaired after a zero-byte file was detected. The replacement pivot and remaining second-batch assets receive the final shared review before packaging.

Exact lower-level variants still share a relevant type example: uncommon mirror shape/frame combinations, paired door arrangements, loft grid/finish combinations, tinted SMART substrates, vertical/zonal SMART segmentation, external blind placement, secondary shower geometries and some support positions. Their selected parameters remain explicit, and the gallery describes the scope of its example. **This implementation does not claim one unique or geometrically exact photograph for every page.** No browser or mobile-layout verification was performed in this audit.
