# Production catalogue research

Research date: 16 October 2026. Implementation: `dist/production-data.mjs`.

## Scope and data contract

The module exports `productionTree` and a default export of the same object. It contains six service families, 70 total nodes and 46 final service options. Every node has `id`, `title`, `intro`, and `image`. Branches have `children`. Final options have `result`, `brief` (four customer inputs), `notes` (two technical conditions), `materialIds`, and `tags`.

This is an enquiry catalogue of processes and results. It does not establish ownership of equipment, the location of processing, capacity, lead times, prices, stock, certification, or the engineering suitability of a particular order. It does not repeat competitors' first-person company claims. Customer text contains no external source URLs.

The clear, untinted base is CrystalVision under the user's direction. Intentional bronze/grey tints, matte layers, decorative films, printing and metal/textile inserts remain separate choices. A competitor's stock pattern or branded product must not automatically be relabelled CrystalVision.

## Family structure

| Family ID | Customer title | Final options |
|---|---|---:|
| `cutting-machining` | Резка, отверстия и вырезы | 10 |
| `edge-finishing` | Кромка и фацет | 8 |
| `thermal-forming` | Закалка и моллирование | 4 |
| `lamination` | Триплексование | 8 |
| `surface-decoration` | Декоративная обработка | 13 |
| `bonding` | УФ-склейка | 3 |

Substrate choice is not used to multiply identical services. Examples of meaningful distinctions: a round drilled hole versus a countersunk seat; ground versus polished edge; straight versus curved bevel; gravity bending versus bending with tempering; textile versus metal-mesh insert; fired ceramic print versus UV-cured print; glass/glass versus glass/metal adhesive joints.

The two digital-machining entries describe an individual complex contour and a coordinated set of contour/hole/cutout operations. They do not promise a particular machine. Combined work can overlap individual operations because it is a different ordering route, not an additional property of glass.

## User reference sources

| Source | What was used | What was not carried over |
|---|---|---|
| [Steklogress processing index](https://steklogress.ru/obrabotka-stekla/) | Process names and distinction between processing and finished-material families | Equipment, own-production, delivery and universal-quality claims |
| [Mek cutting](https://meksteklo.ru/services/obrabotka-stekla/rezka-stekla/) | Straight, shaped and template cutting; request dimensions and drawing | Prices, speed and any-volume promises |
| [Mek drilling](https://meksteklo.ru/services/obrabotka-stekla/sverlenie-stekla/) | Holes, countersinking, fittings cutouts and grooves; coordinates and material as inputs | Numeric processing ranges and guaranteed absence of defects |
| [Mek edge processing](https://meksteklo.ru/services/obrabotka-stekla/polirovka-i-shlifovka-stekla/) | Ground/polished; straight/curved edge choices | Prices and generalized service-life claims |
| [Steklogress bevel](https://steklogress.ru/obrabotka-stekla/obrabotka-kromki-stekla-fatset/) | Decorative bevel; width, side and straight/curved geometry | Own-equipment claims and universal safety assertions |
| [Steklogress tempering](https://steklogress.ru/obrabotka-stekla/zakalka-stekla/) | Thermal processing as a distinct service | Strength multipliers, injury-free promises, speed and capacity |
| [Steklogress lamination](https://steklogress.ru/obrabotka-stekla/tripleks/) | Clear, matte, coloured and decorative inserted compositions | Claims that every insert or every geometry is feasible |
| [Steklogress tempered laminate](https://steklogress.ru/obrabotka-stekla/zakalyennyy-tripleks/) | Tempered plies as a particular laminated composition | Absolute safety and unqualified acoustic/UV performance |
| [Mek laminate](https://meksteklo.ru/services/steklo/tripleks/) | Customer request: dimensions, count, drawing, installation context | General fire-resistance, bullet-resistance and strength claims |
| [Mek sandblasting](https://meksteklo.ru/services/obrabotka-stekla/matirovanie-stekla-i-zerkal/) | Full or patterned matte treatment | Complete privacy under every lighting condition |
| [Steklogress engraving](https://steklogress.ru/obrabotka-stekla/gravirovka-stekla-i-zerkal/) | Engraved graphics and laser process as separate options | In-house equipment or every-design promises |
| [Steklogress enamel](https://steklogress.ru/obrabotka-stekla/stemalit-pokraska-stekla/) | Ceramic enamel requires thermal processing; colour selection | Unverified availability of every colour and lifetime claims |
| [Mek printing](https://meksteklo.ru/services/steklo/fotopechat-na-stekle/) | Customer image, scale, panel layout and viewing side | Competitor lead times and ink-performance claims |
| [Mek decorative film](https://meksteklo.ru/services/steklo/steklo-s-plenkoy-oracal/) | Matte, tinted and graphic film; physical sample for colour | Brand availability, fire behaviour and blanket strengthening claims |

The mirror light-band entry is a customer result combining selective removal of the reflective layer and a diffusing treatment. It does not promise a complete lighting system. Light uniformity remains a property of the assembled lighting construction.

## Primary technical cross-checks

1. [AIG — Crystalvision](https://aigrus.ru/catalog/crystalvision/). Manufacturer description supports a neutral clear base and its use for decorative mirror, back-painted and matte products. The catalogue does not infer that VIPGlass stocks the manufacturer's named derivative brands. Retrieval reference: `turn36view0`.
2. [Guardian — glass types](https://www.guardianglass.com/eu/nl/our-glass/glass-types). Tempered glass cannot be cut; annealed, fully tempered and heat-strengthened glass are distinct. Retrieval reference: `turn19search6`.
3. [Saint-Gobain — Planitherm XN user guideline](https://www.saint-gobain-glass.pl/dokumenty/instrukcje/planitherm-xn-user-guideline-low-e-en.pdf), section 3.7.2. Explicitly states the general tempered-glass rule that holes and notches precede tempering, and cutting or edgework cannot follow it. The catalogue uses only this general sequence, not coating-specific parameters. Retrieval reference: `turn65search20`.
4. [Guardian — laminated glass](https://www.guardianglass.com/eu/en/our-glass/glass-types/laminated-glass). Under sufficient impact laminated glass can break; fragments tend to adhere to the interlayer. Wording in the catalogue is limited to helping retain fragments. Retrieval reference: `turn19search12`.
5. [Guardian — curved glass](https://www.guardianglass.com/eu/en/why-glass/build-with-glass/applications-of-glass/glass-for-facades/curved-facades). Describes gravity bending and more complex curved forms. Shape feasibility is specific to the process. Retrieval reference: `turn51search1`.
6. [Glaston — curved glass processes](https://www.glastory.net/curved-glass-an-obstacle-or-an-opportunity-in-glass-architechture/). Manufacturer technical publication distinguishes bending-and-tempering from other bending routes. No temperatures or machine limits were used. Retrieval reference: `turn51search13`.
7. [Bohle — UV glass bonding](https://www.bohle.com/at-EN/product-groups/workshop-supplies/uv-glass-bonding/). Clean, dry, grease-free contact surfaces and appropriate, even irradiation are required. Retrieval reference: `turn64search1`.
8. [Bohle — UV bonding programme](https://www.bohle.com/uk-EN/service/uv-bonding-seminars/). Confirms glass/glass and glass/metal as separate bonding cases. Retrieval reference: `turn51search6`.
9. [AGC — Artlite Digital](https://www.agc-yourglass.com/en-UK/brands/artlite-digital). Digital enamel deposition supports the ceramic digital-printing family. No AGC brand is offered as VIPGlass stock in the module. Retrieval reference: `turn64view0`.
10. [Irlbacher — screen and ceramic digital printing](https://www.irlbacher.com/en/kompetenzen/screen-printing-and-digital-printing-on-glass). Confirms these as distinct print processes. Retrieval reference: `turn51search11`.
11. [Archetype Glass — metal mesh glass](https://www.archetypeglass.com/projects/metal-mesh-glass-partition-walls/). Fabricator's actual project confirms metal-mesh laminated glass as a real decorative composition. The catalogue makes no strength or protection claim from the mesh. Retrieval reference: `turn65search18`.
12. [Evalam — Vitrum 2025](https://www.evalam.net/fr-fr/noticias/vitrum-2025/). Manufacturer describes micro-mesh textiles with metallic coatings for lamination. This supports the broader insert family, not the compatibility of an arbitrary customer-supplied textile. Retrieval reference: `turn65search7`.

## Content boundaries

- Source technical statements are separated from company capability statements. A service in this proposed catalogue is not documentary evidence of VIPGlass equipment or supplier capacity.
- No numeric dimensions, temperatures, loads, tolerance values, prices, production speeds, stock statuses or certification classes are included.
- No claim that tempering, tinting, matting or lamination automatically makes every application safe.
- No universal suitability of arbitrary coatings, films, fabrics, metals or mirror layers for downstream processing.
- Thick glass, multi-layer glass and decorative mesh are not described as automatically load-bearing or protective.
- Clear-base images must use neutral CrystalVision appearance. Deliberately coloured material is an independent design choice.

## Verification performed

Imported the ES module in Node. Verified unique IDs, non-empty branches, a result sentence on every leaf, four brief inputs and two technical notes per leaf. Counts: 70 nodes / 46 leaves / six top-level families. Asset keys and linked material-family IDs are limited to the integration lists supplied for this task.
