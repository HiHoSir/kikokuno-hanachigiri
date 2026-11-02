# v0.12.0 — expressive actions

Four dedicated transparent PNG key poses: smiling wave, closed-eye bow,
wide-eyed surprise and joyful raised arms. Full-resolution PNG alpha is
unchanged; there is no color-key processing or nonuniform image resizing.

Built-in imagegen used the existing front sprite as the identity reference.
Prompt set: preserve design, proportions and costume; wave with palm beside
face and smiling eyes; bow at waist with closed eyes and joined hands;
surprise with wide eyes, O mouth and hands beside cheeks; cheer with raised
fists and smiling eyes. Assets: `art/actions/{wave,bow,surprise,cheer}.png`.

Wave animates the raised hand repeatedly. Bow uses the generated upper pose
with a waist hinge and the original planted legs/feet, joined at the skirt
hem. Pixel densities are 775 (wave/cheer), 790 (surprise), 800 (bow upper).
The poses are provisional: some generated facial/clothing details differ;
transitions currently change key poses without authored in-between frames.

Actions face the camera and pause translation for 1.8–2.8 seconds. Held
D-pad movement resumes afterwards. Eight-direction walking art is unchanged.
These dedicated poses apply to the candidate source, not the v0.6 comparison.
Real iPhone Safari testing remains outstanding.

QA: 48 logic tests, all four touch buttons, distinct expression/pose state,
return to idle, movement resume, eight headings, terrain, depth, save isolation
and the v0.11.1 slow-start regression. Browser screenshots are CI artifacts.
