# 8-direction reaction acceptance criteria

## Sources
- Character identity, dimensions, feet: `field-lab/art/manifest.json` and eight original PNG files
- Expressive standard: the established frontal dedicated poses in `field-lab/art/actions/`, not the failed experimental front warp
- Motion cadence: `motion-demo` rhythm, timing, weight shifts
- 4 actions × 8 directions = 32 visually distinct, inspectable outcomes.

## Direction-by-direction expectations

| Facing | Wave | Bow | Surprise | Cheer |
| --- | --- | --- | --- | --- |
| Front | One hand beside face, unmistakable alternating wave | Head and torso bend forward from waist | Two hands rise, short recoil/hop | Both hands raised with rhythmic bounce |
| Front-right | Visible hand raised to wave clear of face | Forward waist hinge and clear head descent | Both sleeves recoil | Both hands visibly high |
| Right | Near-side hand rises and waves, not hidden in torso | Distinct forward silhouette bend | Torso recoils, upper limbs lift | Near arm held overhead; bounce |
| Back-right | Arm silhouette visibly alternates | Head/shoulders dip forward, body anchored | Shoulder and sleeve recoil | Both sleeves lifted over shoulder level |
| Back | One hand visibly swings near head | Head/shoulders lowered by waist hinge | Both sleeves lift and hop | Both arms overhead, bounce |
| Back-left | Arm silhouette visibly alternates | Head/shoulders dip forward, body anchored | Shoulder and sleeve recoil | Both sleeves lifted over shoulder level |
| Left | Near-side hand rises and waves, not hidden in torso | Distinct forward silhouette bend | Torso recoils, upper limbs lift | Near arm held overhead; bounce |
| Front-left | Visible hand raised to wave clear of face | Forward waist hinge and clear head descent | Both sleeves recoil | Both hands visibly high |

## Nonnegotiable gates
1. Preserve the exact character's proportions, face, eyes, horn, hair, red bow, outfit and palette across all 8 directions. Original pixels should be retained wherever practicable.
2. Every direction must communicate the **same action as the existing front-specific pose** without relying on UI labels. A swaying body alone is not a wave; vertical bob alone is not a bow.
3. No holes in sleeves/torso; no detached arms, floating hair, warped face or duplicate limbs.
4. Keep original feet planted during stationary wave/bow; jump/recoil may lift feet only temporarily with correct landing.
5. Do not alter live protagonist dimensions, walking, scale, collision, or original artwork files.
6. Validate PNG dimensions and alpha geometry **and** inspect sprite contours at 1×, 2× and 4× (mechanical QA is insufficient).
7. Verify frame-to-frame motion at each angle; hold/start/recover phases must remain readable.
8. A failed result is not integrated. Record precise failure and change synthesis or rigging method before repeating.
9. Test on iPhone Safari after staging; only merge into walk page after positive visual approval.

## Priority
First prove front wave and bow match the established authored front poses. Then transfer them to side, oblique, and back, followed by surprise and cheer. Do not replace front authored art with unreviewed approximations.
