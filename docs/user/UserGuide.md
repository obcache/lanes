# LANES User Guide

## Start playing

Open LANES and select a practice track from Your library. Choose a difficulty, then Play track. A short count-in gives the first notes time to reach the judgement line. Press a lane's key when a note crosses the lime line. You can also tap lanes on a touch screen.

| Difficulty | Active lanes |
| --- | --- |
| Beginner | First three |
| Normal | First four |
| Expert | All five |
| Pro | All five, with additional chords |

Default keys are **D F J K L** from left to right. Escape pauses and resumes; the Pause button does the same. Switching away from the app pauses play. Results show score, accuracy, judgement counts, and best combo. Play again restarts the track; Library returns to your collection.

Perfect hits receive 1,000 points, Good hits 500, and misses zero. Accuracy weights those judgements as 100%, 50%, and 0%. Timing windows are ±45 ms for Perfect and ±110 ms for Good.

## Import music

Choose Import music and select one or several audio files. The app decodes audio locally, detects transients and rhythm, estimates tempo, and creates all four maps. Supported formats depend on the installed audio decoder; WAV, MP3, Ogg, FLAC, and M4A can be selected. A specific codec may need conversion to WAV if decoding fails.

Tracks must be 3 seconds to 30 minutes long and no larger than 100 MB. Silence or recordings without detectable attacks can be rejected. The tempo estimate can have half/double-time ambiguity, and dense or changing-tempo music can produce imperfect maps. Existing maps stay stable after import.

Search matches track titles and artists. The heart marks a favorite; Favorites narrows the library. Reimporting identical audio does not create a duplicate.

## Playlists

Open Playlists, choose New playlist, enter a name, and add tracks from the library. Up and down arrows change order; X removes a track from that playlist. Play playlist starts the first track. Next track advances through the selected playlist. Playlist membership and order are local to this device.

## Keyboard and MIDI

In Settings, click a keyboard mapping and press its replacement key. Escape cancels; learning expires after ten seconds. Each lane needs a unique key. Letters, numbers, space, arrows, and the listed punctuation keys are supported.

Connect your controller, choose Connect MIDI, then select a device and channel. All devices and **All channels** are the defaults. Click a MIDI mapping and play a note to learn it. Learning and gameplay honor the selected device and channel. Note-off and zero-velocity messages do not trigger hits. The default MIDI notes are 60, 62, 64, 65, and 67. Once MIDI is enabled, the app reconnects on the next launch. Keyboard input remains available.

If access is denied, a **MIDI device access is blocked** notice stays visible with **Open device access settings** and **Try MIDI again** buttons. In the desktop app, the settings button opens the **Allow LANES to access MIDI devices** checkbox. Turn it on and retry. This preference saves in local `settings.json`; turning it off closes active MIDI inputs. Existing installations retain their enabled access policy.

In a browser, the button shows the site-permission steps. Use the site information button beside the address bar → Site settings → MIDI devices → Allow for the current site, then retry. Chrome and Edge also get a **Copy settings address** button; paste that address into a new tab to reach their MIDI settings. Web pages cannot directly open protected browser settings. Organization policy or an embedded page's permissions policy may require administrator help. A Web MIDI denial does not by itself identify a Windows privacy switch that needs changing.

## Calibrate timing

Use your normal headphones or speakers and controller. In Settings, start calibration, wait for the count-in, and tap any mapped key, mapped MIDI note, Space, or the calibration lane at each metronome click. Notes descend to the line at 120 BPM.

The estimate changes as samples arrive and filters inconsistent outliers. With at least eight valid taps, the offset saves automatically when the 16-second metronome session finishes. Apply offset saves it earlier. Repeat if the sample timing was inconsistent. Positive offsets compensate for late input; manual adjustment is limited to ±250 ms. Volume and note speed also save locally.

## Customize your profile

Open Profile to set your display name, game background, and lane texture. Upload PNG, JPEG, or WebP images, up to 5 MB and between 16 and 4096 pixels per side. Use default removes a local customization. The lane texture decorates the highway while notes and lane geometry remain readable.

Images apply locally immediately. To upload them to your organization profile, configure the server, Sign in with SSO, and choose Sync profile. Load online profile downloads the saved look to this device and replaces the local display name and artwork. It does not import another computer's library or timing settings.

## Online profiles and leaderboards

Your operator supplies the API base URL, such as `https://lanes.example.com/api`. Save it in Settings, then use Sign in with SSO from Profile. Your organization must assign a LANES player or admin group. Desktop sign-in opens your system browser and returns to LANES; sign-in expires after eight hours or when the desktop app closes.

Finished runs save locally first and attempt to sync when a server is configured. Sync score on the result screen retries an upload; retries do not duplicate a run. Profile statistics on the server aggregate submitted runs. The profile's session counters in the app describe this device's recent local history (up to 2,000 runs).

Leaderboards show the best score per player for the same audio identity, difficulty, and exact chart version. These are community submissions, not verified competitive scores. No invented scores are displayed when offline or when a board is empty. A server connection and organization sign-in are required to view the board.

## Local files and backups

The installed app stores `settings.json`, `library.json`, `playlists.json`, `profile.json`, and `runs.json` under Electron's user-data directory (normally `%APPDATA%\LANES`). Original imported audio is copied into its `media/` folder using content hashes. Installed application files are separate. Mutable JSON writes keep a `.bak` copy of the previous file.

Settings → Export JSON downloads metadata, playlists, preferences, artwork, and recent results in format version 1. Audio is excluded. Import JSON replaces those local records after validation. Export a backup before importing. To move the library to another machine, keep the local media folder too, or reimport the same audio files.

The browser preview stores JSON in localStorage and audio blobs in IndexedDB. Clearing browser site data removes that preview's collection. The preview does not read the desktop's files.

## Troubleshooting

- Missing audio: restore the media folder or reimport the same file.
- Import failed: try a supported codec, a shorter file, or a recording with clearer transients.
- MIDI not responding: reconnect the controller, choose Connect MIDI, and check input device, channel, and note mappings.
- Poor timing: recalibrate after changing sound devices, Bluetooth connections, or controllers.
- Local data cannot open: original files are preserved. Restore the affected JSON from its `.bak` file or a known-good export.
- Online error: check the API URL, sign in again, and ask the operator to check PHP extensions, migrations, and identity-provider group claims.
