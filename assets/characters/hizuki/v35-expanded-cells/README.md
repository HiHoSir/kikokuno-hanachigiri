# Hizuki V35 expanded-cell spritesheets

8 motions × 8 directions × 8 frames (512 frames). Each PNG is an 8-column × 8-row sheet. Frame size differs by motion; use full sheet dimensions divided by 8. Original character scale is preserved; cells were expanded to avoid clipping. Transparent background. Motions: walking, running, attack_katana, attack_wakizashi, cast, hit, victory, fall.

This is the compact runtime spritesheet distribution. Individual PNG frames and source processing bundle are stored in the ChatGPT Library at `/鬼哭の花契り/緋月V35/Hizuki_V35_8motions_expanded_cells.zip`.

Idle and Interact are not included. Runtime cell geometry and padding-derived model-origin anchors are registered in `../../hizuki-v35/character.json`. All 512 cells match the original individual PNGs including direction/frame order; see runtime-audit.json. Dedicated Idle remains unavailable; first fall frames are used as temporary directional standing poses. In-game aesthetic and iPhone Safari review remain separate from data checks.
