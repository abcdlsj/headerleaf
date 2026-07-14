# Headerleaf

A tactile, group-based request header switcher for Chrome. Keep header sets on separate colored sheets, switch the active sheet in one click, and enable individual key/value pairs as needed.

## Features

- Colored header groups with one-click switching
- Per-header enable and disable controls
- Editable header keys and values
- Automatic local persistence
- Native Manifest V3 request modification via `declarativeNetRequest`
- No remote services, analytics, or injected page scripts

## Development

```bash
pnpm install
pnpm dev
```

WXT opens a development Chrome profile with the extension loaded. For a production bundle:

```bash
pnpm compile
pnpm build
pnpm zip
```

The unpacked Chrome extension is written to `.output/chrome-mv3/`.

## Load manually

1. Run `pnpm build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Choose **Load unpacked** and select `.output/chrome-mv3/`.

## Privacy

Headerleaf stores configuration only in `chrome.storage.local`. The `<all_urls>` permission is required solely to apply enabled request headers to matching browser requests.
