# Dinosaur walk rig

The v1 sheets changed the characters' poses without a stable supporting-foot path. These v2 sheets keep a constant
body image and animate hinged thigh/shin/foot parts around a planted-foot trajectory.

The built-in image-generation tool produced the three `*-parts.png` kits from the approved character references.
Each prompt requested exactly four transparent components in a 2 × 2 grid: an intact legless body preserving the
approved head/neck/arms/tail/colors, a vertical upper leg, a vertical lower leg, and a right-facing clawed foot;
the long-neck kit preserves its four-legged silhouette when assembled. No CLI/API fallback was used.

`tools/export-dinosaur-walks.cjs` composes those parts into 24-frame 6 × 4 atlases, using the authoring math in
`tools/dinosaur-gait.cjs`. The biped legs use opposite phases with 62% stance time. The quadruped uses four offset
phases with 78% stance time, keeping at least three supporting feet down. Feet travel backwards at constant ground
speed while planted and swing forward with clearance; inverse kinematics keeps both bone lengths fixed.

`walk-manifest.json` records exported poses and each sprite's stride distance at the 128-pixel display size.
The TV player uses that stride distance to tie frame playback to its actual horizontal crossing speed.

The v3 proportions lower the intact bodies and shorten/thicken the limbs. The complete silhouette is kept below
0.85 times its width, and the exported standing hip-to-ankle rise stays below 36 source pixels. This preserves the
approved squat character shapes while retaining the same grounded stepping method. The taller v2 sheets remain
in this authoring folder for comparison and are not packaged in the app.

Regenerate with `node tools/export-dinosaur-walks.cjs` after making playwright-core and Chrome available
(`DINOSAUR_PLAYWRIGHT_MODULE` and `DINOSAUR_CHROME` can provide their locations). Run `node tests/dinosaur-gait.cjs`
and the browser visitor checks after regeneration.
