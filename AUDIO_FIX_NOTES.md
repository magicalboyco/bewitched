# Audio fix — Bewitched v0.4.5

- New welcome-screen **Enable Music + Sound** button explicitly creates/resumes Web Audio after a user gesture, clears old mute preferences, sets a clearly audible starting volume, and plays a three-note sound check.
- Adds a new original rhythmic plucked-string/harp-style 6/8 welcome melody to the menu; gameplay continues to use Moonlit Apothecary.
- New **Enable / Test Game Sound** button in the game music mixer.
- Music and SFX remain separate and can be adjusted independently.
- Syntax-checked the embedded and rewritten modules locally. Browser playback still requires actual listening on the target device; third-party embedding can block audio.
- Does not modify the main gameplay or PR branches.
