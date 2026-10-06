# Voryki playable assets

Generated using the built-in imagegen tool. No source image was edited with Python or other raster utilities. Images were copied into this folder and inspected using read-only alpha scans.

- `map.png`: 1536 × 1024. Approved map layout retained; central characters removed, crops removed, right farm fence opened.
- `sprites.png`: 1536 × 1024 PNG with real alpha. 24 frames in a visual six-column/four-row arrangement. Rows: down, left, right, up. Columns: human idle/leftstep/rightstep, V01 idle/leftstep/rightstep. V01 has a smooth head with ears and amber mark, no head leaf. All left-facing hero frames face left. Back-facing V01 tails are teal with small green leaf tips, replacing the initial white feather shape.
- `sprites.json`: verified alpha-bound frame rectangles, threshold 16. Use these rectangles rather than a fixed 256 × 256 slice: imagegen did not align sprites to exact nominal cell boundaries. Draw the cropped frames with a common foot baseline and consistent scale per character. Keys `human` and `V01`, then directions `down`, `left`, `right`, `up`, then arrays `[idle, leftstep, rightstep]`. Each frame is `{x, y, w, h}`.

## Final prompt set

### Map cleanup

Use case: precise-object-edit
Asset type: playable top-down pixel RPG map background, 1536x1024 landscape.
Image 1 is the exact edit target and approved environment. Edit this image minimally.
Remove the brown-haired human sprite and the small teal creature sprite from the central sandy path and seamlessly reconstruct the same sand texture underneath. Remove ALL planted crops from the fenced farm in the left-middle area; reconstruct bare brown tilled soil with subtle tiny earth marks. Preserve the farm crates and boundary, but remove the middle segment of the right farm fence to create a small entrance onto the adjacent sandy path. This entrance should be about one character wide; preserve the other right fence sections.
CRITICAL INVARIANTS: Preserve the exact entire environment, spatial layout, top-down camera, colors, shadows, pixel detail and dimensions. Keep BOTH blue-roof buildings, their doors and windows, river bends, bridge, cave, blue crystal pedestal, orange ore rocks, all trees and stumps, paths, grass, flowers, crates and signs unchanged. Original Nintendo-era Pokemon-like top-down crisp pixel art, same palette and same pixel scale. No environmental redesign, no new objects.
No characters anywhere, no planted farm crops, no UI, no labels or text, no watermark. Output only the cleaned map filling the whole image.

### Sprite generation

Use case: stylized-concept
Asset type: production transparent PNG overworld sprite atlas for a pixel RPG.
Image 1 is identity reference for ONLY the brown-haired hero and small teal V01 creature, not for sheet layout. Image 2 is pixel scale/style reference. Produce a NEW exact uniform sprite atlas of these two characters.
CRITICAL LAYOUT: Canvas landscape 1152x768. EXACTLY SIX equal columns and FOUR equal rows, 24 total sprites, one centered sprite per 192x192 cell. Entire canvas has real transparent alpha. No margins beyond the cell padding. All sprites' feet aligned to the same baseline within their cell. Do not draw grid lines, panels, checkerboard, labels, text, shadows, ground or scenery. Rows and columns are invisible to viewer.
Row 1, face down/front: columns 1-3 HERO idle, left-leg step, right-leg step. Columns 4-6 V01 idle, left-leg step, right-leg step.
Row 2, face left: columns 1-3 HERO idle, left-leg step, right-leg step. Columns 4-6 V01 idle, left-leg step, right-leg step.
Row 3, face right: columns 1-3 HERO idle, left-leg step, right-leg step. Columns 4-6 V01 idle, left-leg step, right-leg step.
Row 4, face up/back: columns 1-3 HERO idle, left-leg step, right-leg step. Columns 4-6 V01 idle, left-leg step, right-leg step.
HERO: exact identity from reference: tousled brown hair, small friendly face, teal shirt/jacket, ochre scarf, brown backpack, brown trousers and boots. Compact low-resolution humanoid sprite with logical 24x32 pixel anatomy, drawn at exactly 3x nearest-neighbor enlargement (sprite about 72x96 rendered pixels), thin dark one-logical-pixel outline, 2-3 shade levels. Same proportions and size in all twelve hero frames.
V01: small slim teal creature from reference, cream muzzle and underside, small round ears, amber forehead diamond, small leaf collar and modest leafy tail at the REAR. NO LEAF ON TOP OF ITS HEAD, NO HORNS, NO ANTLERS, NO HEAD SPROUT. Small compact low-resolution overworld animal logical 24x24 pixel anatomy drawn at exactly 3x nearest-neighbor enlargement (sprite about 72x72 rendered pixels). Keep round ears, slim body, small feet, tiny black eyes consistent in all twelve frames. Not a big pet portrait. Modest tail always sprouts from rear body.
Every frame is crisp blocky pixel art, no anti-aliasing or smooth gradients. Exact uniform transparent padding. Idle stance symmetric; walking steps show subtle alternating legs and arms only. Front/back face camera, profiles truly left/right. Same anatomy and palette in all views. Include ALL 24 frames and nothing else.

### Sprite correction: head and facing

Use case: precise-object-edit
Image 1 is the edit target: exact 6-column 4-row transparent sprite atlas. Image 2 is identity reference only.
Edit only these targeted defects in Image 1, while preserving the 1536x1024 dimensions, exact 6x4 cell placement, transparent alpha padding, crisp pixel art and character identities.
1. In top row, last THREE teal creature sprites, REMOVE the entire green leaf projection located directly above each head. Each creature must have a smooth simple round teal crown, two small round ears, and amber forehead diamond. Absolutely NOTHING protrudes from its head. The green tail can be shown modestly beside the body near the lower hip as in the original front creature reference; never above the head. Preserve all other creature details.
2. In second row, first THREE hero sprites, ensure ALL THREE face to viewer LEFT. Especially the third hero in this row currently wrongly faces right; redraw it facing LEFT to match the others, with the alternate walking leg position.
3. In first row first THREE hero sprites, make walking sprites face fully forward/down like idle, with the two eyes visible and only subtle alternating leg/arm movement. Keep hairstyle and gear unchanged.
All 24 cells must remain distinct exactly SIX columns x FOUR rows, same per-cell centers and foot baselines. Rows down,left,right,up; first 3 columns hero idle,leftstep,rightstep; last 3 creature idle,leftstep,rightstep. Actual transparent background preserved. No added text, lines, shadows, backdrop. Do not draw a checkerboard. No green head leaves, horns or antlers on any creature.

### Final successful correction: one left-facing frame

Use case: precise-object-edit. Pixel game sprite sheet surgical correction. Input is exact approved 6 columns x4 rows transparent atlas 1536x1024. Change ONLY ONE sprite: HUMAN in SECOND ROW, THIRD COLUMN from left (center approximately x646,y423). It currently faces right; horizontally flip/redraw that one sprite to face LEFT, matching human to its immediate left. Its face and nose must point LEFT; its backpack must be on RIGHT side behind its body. Preserve its alternating walking pose. Preserve exact sprite size, position, colors, style. Keep every other sprite and every other pixel unchanged. Keep actual transparent alpha background. No new sprites, objects, head leaves, grid, text, shadows, or backdrop. Do not change 6×4 layout or image dimensions. The sole change is second-row third-column human facing left.

A later layout-only candidate was discarded because it retained irregular placement and removed the front forehead marks. The successful version above is `sprites.png`.

### Final tail identity correction

Use case: precise-object-edit. Surgical color/anatomy correction on an approved pixel sprite sheet.
Edit ONLY the LAST ROW, LAST THREE V01 creature sprites facing up/back. Their large white/cream diagonal feather-like tail shape is incorrect. Replace that white feather shape with a modest TEAL furry tail rooted at their rump, matching their teal body, and a SMALL GREEN LEAF TIP at the outer end. Tail should be mostly teal, not cream/white and not a giant leaf. Use the same crisp pixel art and thin dark outline. The tail can curve slightly to their lower-left while remaining within the same existing sprite bounds. This change applies to all three back-facing creature frames at approximate x893,1133,1367; y910.
Preserve EVERY other character frame, all front and profile creature frames, all twelve human frames, all positions, animation poses, dimensions, colors and transparent padding. Keep 1536x1024 canvas and 6-column4-row arrangement unchanged. All V01 heads remain smooth round teal with small ears and NO head leaf, NO horns, NO antlers. No white feather tail. No text, grid, shadows, checkerboard, scene, or backdrop. Genuine PNG alpha transparency. The sole local change is back-facing V01 tail replaced with teal fur and small green leaf tip.
