# Agent instructions for this kit

## Scope and starting point

This is a Samsung Tizen web design handoff, not an already configured launcher for the recipient's TV. Read README.md, SETUP_SAMSUNG.md, Q60C_COMPATIBILITY.md and HOW_IT_WAS_BUILT.md. The intended target is QN75Q60CAFXZA (2023 Q60C), with installed firmware and OS unverified. The default adapter in web/tv-bridge.js is always a safe demo. It must stay inert until the recipient asks you to wire their TV and you have confirmed the device identity.

Do not modify or connect to the original owner's TV. No owner address, credential, DUID, certificate, token or registry backup is supplied. Do not infer these from the original Q80B product/app names in the reference text.

## Preserve the design

Keep the header weather left, year bar centred and time right; exact days left and calendar-accurate quarter divisions; subtle grey quarter breaks; compact rounded glass cards; focus-only footer underlines; and all eleven local photos/crops. The original interface draws directly at 1920×1080 on the tested TV, with --ui-scale lengths and no whole-canvas transform. The photos are 3840×2160; this does not imply a 4K web framebuffer.

Chromium 85 requires explicit top/right/bottom/left rather than inset shorthand. Selected cards use a rounded shadow, not a square CSS outline. The Settings SVG has an intrinsic white stroke. No SF Pro binaries are bundled; keep font fallbacks and artwork credits.

## Adaptation and signing

Identify model, firmware, Tizen and the actual source/device inventory before any native work. Match the TV identity before each write. Start with the official Samsung SDK/certificate workflow; the recipient's target DUID belongs in their own distributor certificate. Preserve the author certificate for future updates and keep signing materials outside the source tree.

ScenicKit1.Home is the demo identity. If you choose a production identity, update native-helper caller guards, app IDs and manifests consistently. The reference adapter assumes Q80BHome01.Home plus a separately installed CEC helper, fixed device identities, and observed native source types. Copying that file alone does not supply its helper or establish compatibility.

The CEC reference calls model-specific native libraries. No proprietary framework DLLs are included. Any helper must be built against an appropriate target, normally signed for the recipient's TV, and verified with a narrow action/caller scope and a stop/remove path. Do not install the sender's binary packages or reproduce an unrelated device's private state.

## Home routing, cleanup and recovery

An installed web app does not establish a system-wide Home-button override. Research that separately for the recipient's model. Capture and preserve their original routes and app activation flags before changes. Prepare and test a scoped undo; do not bulk-restore a registry or transplant another TV's snapshots. Do not treat all preinstalled/system apps as bloat. Preserve native Settings, picture/audio controls, remote volume/power behavior and a route back to Samsung Home.

No root, exploit or certificate-bypass tooling is supplied. A persistent HDMI-loss watcher is not implemented. The experimental idle shutdown from the original setup was awaiting confirmed pairing and standby verification, and is disabled in this demo. The floating native mute overlay was unresolved. Do not turn these into claimed features based on mocks.

## Verification

Run python3 tools/verify.py before changing the pristine kit. Run node --test tests/*.test.cjs for demo isolation and calendar/weather behavior. build_demo.py creates only an unsigned widget. Installation and physical TV acceptance are separate from packaging and browser preview. Keep baseline artifacts and use the same author for signed forward updates; retain a higher-version rollback package before replacing a tested build.

Weather, date and clock default to Vancouver. If changing location, update the forecast endpoint, clock/calendar logic and tests together; older TV timezone databases can be stale. Do not silently enable experimental power behavior.
