# Headerleaf Privacy Policy

**Effective date: July 16, 2026**

Headerleaf is a Chrome extension that lets users create profiles of custom request headers and apply the selected profile to outgoing browser requests.

## Data collection

Headerleaf does not collect, transmit, sell, or share personal information, browsing history, analytics, or usage data.

## Local storage

Headerleaf stores the following configuration locally on the user's device using `chrome.storage.local`:

- Header profiles and profile names
- Header keys and values
- Per-header enabled or disabled states
- The currently selected profile

This configuration is not uploaded to Headerleaf, its developer, or any third-party service. Users should still avoid storing secrets in the extension unless they understand that enabled header values are sent to the destination servers they contact.

## Request processing

When a header is enabled in the selected profile, Headerleaf uses Chrome's `declarativeNetRequest` API to add that header to matching outgoing requests. The destination server receiving a request can therefore receive and process the header values configured by the user. Headerleaf does not independently receive or retain those requests or values.

## Permissions

Headerleaf uses the following permissions solely to provide its core functionality:

- `storage`: Saves profiles and header configuration locally.
- `declarativeNetRequestWithHostAccess`: Creates dynamic rules that modify outgoing request headers.
- `<all_urls>`: Allows user-configured headers to be applied to requests across domains.

Headerleaf does not use these permissions to read page content, inject scripts, track browsing activity, or build user profiles.

## Remote code and third parties

Headerleaf does not load or execute remote code. All JavaScript, fonts, and dependencies are bundled with the extension. Headerleaf does not include advertising, analytics, tracking SDKs, or third-party data processors.

## Data retention and deletion

Configuration remains in the browser's local extension storage until the user changes it, clears the extension's data, or uninstalls Headerleaf. Uninstalling the extension removes its locally stored configuration according to Chrome's extension data handling behavior.

## Children's privacy

Headerleaf is a developer utility and is not directed toward children. It does not knowingly collect personal information from anyone, including children.

## Changes to this policy

If this privacy policy changes, the updated version will be published in this repository with a revised effective date.

## Contact

Questions or concerns about this privacy policy can be submitted through the project's public issue tracker:

https://github.com/abcdlsj/headerleaf/issues
