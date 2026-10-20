# How this Samsung home screen was built

This started as a private project on a Samsung QN65Q80BAFXZC (2022 Q80B), running Tizen 6.5 and Chromium 85. It was vibe-coded with Codex as an alternative to Samsung's stock Home screen, using ordinary web source, Samsung developer signing and carefully scoped native investigations. A second target, QN75Q60CAFXZA (2023 Q60C), has been identified by model number; its installed firmware and physical behavior are unverified.

## 1. Identify the actual device

Read-only local discovery and Samsung's device information established the model and software. Every installation checked that it was still the intended TV. A Samsung TV is not an Android TV: an Android launcher APK is not the installation route used here.

## 2. Build and refine the design on a computer

The interface is plain HTML/CSS/JavaScript. It was refined in a browser before installation: landscape photography, glass source cards, smaller official device marks, a quiet footer and the weather/year/clock header. The year calculation uses calendar days and actual quarter lengths. The editor saves names, port mappings and visibility in local storage. No account or backend is needed for the design.

Eleven photographs are bundled: Yosemite, San Francisco, six New Zealand views and three Vancouver views. Photos rotate every five minutes and retain source credits. Weather is fetched from Open-Meteo. SF Pro uses a locally installed face on the Mac; the TV uses its available fonts.

## 3. Use Samsung's normal development signing

Developer Mode was enabled with the development computer's network address, followed by a full TV restart. A Samsung TV author/distributor certificate profile was created for the TV's developer signing DUID. The web source was packaged as a .wgt, signed, installed and launched through the normal developer workflow. Signing keys stayed private.

See Samsung's [certificate guide](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html) and [TV device guide](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html). A friend needs their own setup; the original owner's device-signed widget is not supplied as a reusable installer.

## 4. Fix real TV rendering differences

The first scenic build showed controls but no photo, plus a square outline around the selected card. The TV engine did not implement the CSS inset shorthand as expected. Explicit offsets restored the images, and rounded shadow focus replaced the square outline. These fixes were confirmed on the physical TV.

The initial layout was scaled from a 1280×720 canvas. It was changed to calculate CSS lengths directly at the viewport size, improving text/icon sharpness. Samsung Web Inspector reported a 1920×1080 viewport/screen and device pixel ratio 1 on this TV. The eleven image files were separately improved to exact 3840×2160 JPEGs from retained originals without upscaling. Photo resolution and the application's framebuffer resolution are different things.

Samsung documents the standard application target in its [general specifications](https://developer.samsung.com/smarttv/develop/specifications/general-specifications.html). New models should still be checked rather than assumed identical.

## 5. Add native input and Settings handoffs

The visual design and the TV controls are separate layers. The original adapter used observed native source types and native Samsung Settings/Home applications. Apple TV was on HDMI 3 and PS5 on HDMI 1. A small normally signed native CEC helper checked its caller and the actual device name/port, requested the stream path, opened the native input viewer and exited. An earlier bounded Apple TV CEC test produced a picture confirmed by the owner; full sleeping-device behavior across models was not established.

The original code is in reference/ as inert text. Its source mappings, helper identity, entry points and native libraries require validation on another model. The portable kit deliberately substitutes a demo adapter, so it does not claim native switching just because the cards animate.

## 6. Keep cleanup and Home routing reversible

On the original TV, scoped native Home/startup assignments were changed with original-value capture and individual apply/readback/undo/readback trials. Selected promotional and streaming components were deactivated while their files/data were retained. This was separate from installing the web app. It was not a replacement firmware image or a universal jailbreak/debloat recipe.

Recovery used the original TV's own captured settings and scoped tools. A forward-version widget rollback, signed with the same author, restored an older UI payload without depending on a downgrade. These private snapshots/tools are not in this kit. A recipient needs fresh inventory, baseline and undo evidence for their own TV before doing equivalent work.

The recorded cleanup flags and native Home/startup routes were audited after updates. A targeted-ad process was later observed running despite recorded deactivation/onboot flags, so long-term ad suppression should not be presented as universally solved. Physical Home/cold-boot and sustained HDMI-loss acceptance are separate from route readback; no persistent HDMI-loss watcher was installed.

## 7. Keep unfinished features labelled

An experimental 30-minute Home-idle shutoff was developed with a warning and cancellation on user input/backgrounding. The original TV's plain remote WebSocket failed; a signed native helper then reached its secure, certificate-pinned loopback channel, but pairing/standby were not confirmed. That hardware-specific power helper is not supplied here, and the demo cannot turn a TV off.

A floating Samsung mute symbol was reported over the launcher. The app did not issue audio commands, and the TV reported mute off when checked. That intermittent native overlay was unresolved. This kit does not claim to fix it or change audio settings.

The portable deliverable is the approved design and source, plus a reproducible handoff for adapting native behavior to the recipient's device.
