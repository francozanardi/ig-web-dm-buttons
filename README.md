# ig-web-dm-buttons

When you comment on a post and the creator replies with an automated DM (ManyChat and similar tools), the message usually comes with buttons to get a link or continue the conversation.

**The official mobile app shows those buttons, but instagram.com doesn't.** You only see the message text, which often tells you to tap a button that isn't there.

This userscript draws them back in.

## Usage

1. Open your DMs on instagram.com.
2. Open the DevTools console (F12 → **Console**).
3. Paste the contents of [`script.user.js`](./script.user.js) and press Enter.

The buttons appear in blue under the message. You'll need to paste it again after reloading the page.

### Optional: run it automatically

If you don't want to paste it every time, install it as a userscript with [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/): open the `.user.js` file → click **Raw** → your extension will offer to install it.

## What it supports

- 🔗 **Link buttons**: opens the URL in a new tab.
- ↩️ **Reply buttons (postback)**: sends the same reply the official app would, so the bot continues the flow (usually sending you the link).

Quick replies and carousel cards are not handled (yet).

## ⚠️ Heads up

This relies on Instagram's internal, undocumented code (React fibers, the Relay store and internal module names). **It will break whenever Instagram changes those.** Last confirmed working: November 2026. If it stops working, open an issue.

Not affiliated with Meta. Use at your own risk.

## License

MIT
