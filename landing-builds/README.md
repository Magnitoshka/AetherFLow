# Landing Builds

This folder is the local export target for installer files that can be uploaded to a landing page or static hosting.

Generate the installer first:

```bash
npm run dist
```

Copy it into this folder with stable download names:

```bash
npm run landing:copy
```

The script creates:

- `AetherFlow-Setup-latest.exe`
- `AetherFlow-Setup-<version>.exe`
- `manifest.json`

Use this stable landing link after uploading the folder contents:

```text
/landing-builds/AetherFlow-Setup-latest.exe
```

Installer files are intentionally ignored by Git because GitHub blocks very large regular repository files. For public distribution, upload the generated `.exe` to your landing host or attach it as a GitHub Release asset.
