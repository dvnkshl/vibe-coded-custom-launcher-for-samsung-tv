# Put the visual demo on your Samsung TV

Start with the computer preview in README.md and the supplied [QN75Q60CAFXZA compatibility notes](Q60C_COMPATIBILITY.md). These instructions install a separate visual demo named **Scenic Home Demo**; its input, Settings and power shortcuts deliberately do not control the TV. The next stage is a model-specific adapter, not an automatic Home replacement.

## Prerequisites

- A Samsung Tizen TV compatible with the project's declared minimum Tizen 6.0. Only the original 2022 Q80B / Tizen 6.5 has physical design evidence so far.
- A computer and the TV on the same network.
- Samsung's TV SDK/TV Extension and Samsung Certificate Extension installed through the official tools.
- A Samsung developer account and a certificate profile covering this TV's **developer DUID**.

## Connect and sign

1. Record the TV's model, firmware and network address from its own information/settings screen.
2. Follow Samsung's [Developer Mode instructions](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html). Enable it in Apps/App Settings using the number sequence 12345, set the development computer's actual LAN address, and fully restart the TV. Menus vary by model; use the current documentation if your Apps layout differs.
3. Add that TV in Tizen Studio's Device Manager and connect it. Use its developer DUID from the developer tools when creating the distributor certificate; do not substitute a network UUID.
4. In Certificate Manager, create a **Samsung → TV** profile using your own account and keys. Include the target TV's DUID in the distributor certificate. Retain the author certificate for future updates. See Samsung's [certificate instructions](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html).
5. Import the web/ directory as an existing Tizen web application project. Choose your active certificate profile. Use the normal device “Permit to install applications” step if the tools request it.
6. Package/sign the project, then choose **Run As → Tizen Web Application** on your connected TV. This changes only the installed demo app, not Samsung Home, startup routing, audio or app activation flags.
7. Verify the photo, rounded selection, white Settings gear, remote navigation, input editor, weather and header on the physical TV. A successful install message alone does not prove they render correctly.

Samsung's [TV-device guide](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html) covers connecting, running and common certificate errors. It also explains that ordinary web-widget USB installation is unsupported; do not expect dragging this ZIP to a USB drive to install it.

## Optional unsigned build

```sh
python3 tools/build_demo.py
```

This creates build/ScenicKit1-1.0.0.unsigned.wgt and a hash receipt. It is **not signed or installable as-is**. Use the web/ project with your own Samsung signing profile for installation. The packager never contacts a TV.

The demo's package/application IDs are ScenicKit1 and ScenicKit1.Home, separate from the original Q80B launcher. If that identity already exists on your TV, inspect it before replacing anything and choose a new project identity for your own work.

## Adapt real controls with your agent

Once the visual demo works, use AGENT_PROMPT.md. The original adapter/reference is for one Q80B, with an additional native CEC helper. Source switching, device wake and native Settings links need model/device validation. Home-button takeover, startup assignment and app cleanup need their own baseline and tested undo on your TV.

The shutdown experiment and mute overlay remain unresolved in the original setup. They are not prerequisites for using this design, and no power helper or root tool is part of the demo.

## Remove the demo

Uninstall **Scenic Home Demo** from the TV's Apps interface, or use the normal SDK application manager for ScenicKit1.Home. Because this demo does not change native Home/startup/cleanup settings, it has no such settings to restore. Any later native adapter/Home work must document its own recovery separately.

## Edit the design

- Layout/material/type: web/styles.css.
- Source names/port defaults: DEFAULTS in web/app.js; the on-screen editor changes local preferences.
- Photo set/crops: web/assets/photos.js, sources.json and local JPEGs; preserve credits.
- Vancouver forecast endpoint and clock/calendar logic: web/home-info.js. Change both together if using another location.
- Native behavior: web/tv-bridge.js. It is intentionally a demo adapter until you adapt your device.

Run the tests again after edits and compare the physical result. Do not bundle SF Pro font files or relabel third-party photos/brand marks as your own artwork.
