# Scenic Home · friend kit

The same scenic Samsung TV design: eleven 4K photographs, compact glass Apple TV and PlayStation cards, Vancouver weather, a quarter-by-quarter year bar and the clock. Editable HTML, CSS and JavaScript; no framework or build dependencies are needed for the computer preview.

## Open it on your computer

From this folder, run:

```sh
python3 tools/preview.py
```

Use Python 3.9 or later. On Windows, use `py -3 tools/preview.py`. Open the localhost URL it prints. Arrow keys, Enter and Escape work like a TV remote. Preferences and Edit layout work locally. Stop the server with Ctrl+C.

**This is a design demo and source handoff. Its TV controls are deliberate no-ops**, even on a Samsung TV. It cannot switch HDMI, power off the TV, change Samsung Home or remove apps. Weather contacts Open-Meteo; the photographs and icons are bundled locally.

## Give it to your agent

Paste [AGENT_PROMPT.md](AGENT_PROMPT.md) into your coding agent, with this folder attached. [AGENTS.md](AGENTS.md) explains the source and compatibility boundaries. The agent should identify your TV before implementing its controls.

## Install the visual demo on your Samsung

See [SETUP_SAMSUNG.md](SETUP_SAMSUNG.md). You need Developer Mode, the Samsung TV SDK and a certificate profile covering **your** TV. No signed package or signing credentials from the original owner are included. Installing the demo does not make it the remote's default Home screen.

The intended recipient TV is **QN75Q60CAFXZA**, a 75-inch 2023 Q60C. Samsung lists the Q60C generation under Tizen 7.0, above this project's declared minimum Tizen 6.0; its currently installed firmware/OS still needs checking because OS upgrades exist. The design is a plausible candidate, not yet physically verified on that TV. The original interface was physically checked on a 2022 Q80B running Tizen 6.5 / Chromium 85. See [Q60C compatibility](Q60C_COMPATIBILITY.md) for the agent's checklist and sources.

## What is included

- `web/`: the exact visual files from source version 0.7.2, with a safe demo adapter and a separate demo application identity.
- `HOW_IT_WAS_BUILT.md`: the process, technical choices, recovery approach and remaining limitations.
- `DESIGN.md`: layout, colours, materials, type and remote-focus rules.
- `reference/`: the original Q80B adapter, application source/configuration and native CEC source, as inert text for your agent to inspect.
- `tools/`: a local preview server, unsigned demo packager and integrity checker.
- `tests/`: the demo's TV-isolation test plus the reusable calendar/weather tests. Run with `node --test tests/*.test.cjs` if Node.js is available.
- `ORIGIN.json` and `SHA256SUMS`: provenance and file integrity.

No private keys, Samsung account data, DUIDs, tokens, owner IP addresses, firmware/framework binaries, TV registry backups, device-management scripts or signed owner packages are included.

## Defaults

Apple TV is labelled HDMI 3 and PlayStation HDMI 1. HDMI 2/4 are hidden; Edit layout changes names, mappings and visibility. These are demo labels, not confirmed connections. Weather and calendar time are Vancouver-specific. Photographs rotate every five minutes. SF Pro is used only when installed on the viewing computer; Samsung/system fonts are the TV fallback. No Apple font files are included.

The experimental 30-minute shutdown switch defaults off in this kit and sends no power commands. Power pairing/standby and the original intermittent native mute overlay remained unresolved when this handoff was created. See the build explanation before enabling advanced features.

Artwork credits and source pages are in `web/assets/CREDITS.txt` and `web/assets/sources.json`. Third-party artwork retains its own terms; this bundle does not relicense it.
