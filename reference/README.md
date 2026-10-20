# Original Q80B reference · inert text

These files document the original device-specific implementation; they are not loaded by the demo or packaged in its widget.

- q80b-tv-bridge.js.txt: original native adapter from source version 0.7.2.
- q80b-app.js.txt: original application logic before the friend's always-preview/default-idle-off adjustments.
- q80b-config.xml.txt: original web manifest with its original application identity and privileges.
- q80b-cec-bridge.cs.txt: original display-less CEC helper source. Its caller is Q80BHome01.Home, its two device names and ports are fixed, and it calls native libraries observed on that 2022 Q80B.
- q80b-cec-manifest.xml.txt: its original native manifest.

The remaining visual/runtime source is in web/. ORIGIN.json records the original source hashes and the small demo-only differences. This preserves an inspectable copy of what produced the approved design without supplying a runnable device-management recipe.

No compiled native helpers, Samsung/Tizen framework binaries, signing profiles, root tools, private registry backups, owner addresses or TLS pins are supplied. The experimental power helper is omitted. Read HOW_IT_WAS_BUILT.md before adapting this reference to another model.
