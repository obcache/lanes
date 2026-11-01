# Manual QA

Use a disposable workspace/export before changing test data. Automated coverage and its limits are in `docs/developer/testing.md`.

- Install the current Windows installer, launch LANES, check the custom titlebar's minimize/maximize/close actions and app/launcher icons. Start the complete packaged app directory without source files. Uninstall and confirm application files are removed while user-data JSON/media remain.
- Import WAV and representative MP3/Ogg/FLAC/M4A recordings. Verify source duration, four maps, 3/4/5/5 active lanes, notes tracking audible transients, and no notes during silence. Listen across steady beats, syncopation, quiet intros, dense mixes, and variable tempo. Verify duplicate imports and unavailable codec errors.
- Play every difficulty using the default keys and remapped keys. Hit chords, Perfect/Good windows, misses, pause/resume, focus loss, count-in, results, retry and playlist advancement. Confirm scoring and audio stop when leaving gameplay.
- Create/reorder a playlist, mark favorites, search, restart the app, and confirm persistence. Export JSON, restore it, and verify audio still resolves from the managed media folder. Test a backup on another device with copied media.
- Connect a physical MIDI controller, choose all channels and a specific channel/device, learn all five unique notes, test note-off/zero velocity, hot-unplug/replug, and app restart reconnect. Verify keyboard remains usable.
- Turn off MIDI in Device access settings, connect, and verify the permission notice opens the saved access checkbox. Allow access and retry; the notice should disappear. In Chrome/Edge, verify site-permission help, settings-address copy, and recovery after manually allowing the site. Organization policy must not be presented as a setting LANES can override.
- Calibrate on real speakers/headphones and MIDI. Confirm the estimate stabilizes across at least eight taps, auto-saves after the session, ignores outliers, and improves real play. Repeat after changing output devices.
- Upload valid and invalid background/lane images. Test rapid selection of both images, transparency, default/reset and restart persistence. Notes and judgement line must remain readable with bright artwork.
- On the actual PHP/Apache/MySQL deployment, test OIDC player/admin/unassigned groups, expired/revoked credentials, browser and desktop sign-in, profile asset sync/roundtrip, auto-submitted result statistics, retry deduplication, one best leaderboard result, and chart-version separation.
- Back up and restore the production database and private assets in a separate environment before going live. Validate migration version, identities, chart checksums, run counts and board ranking. Do not equate SQLite fixture restoration with MySQL verification.
- Inspect desktop 1440×950 and native-size concept 1586×992; browser 390×844. Use keyboard focus and accessible labels; check scrolling, forms, titlebar, notices, empty states and long imported titles.

Physical MIDI, real-provider login, production MySQL, and cross-genre listening remain external acceptance checks until explicitly recorded as tested.
