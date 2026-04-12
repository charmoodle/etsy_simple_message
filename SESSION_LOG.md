# Session Log

## 2026-04-12: Initial Build

### Summary
Built Etsy Message Assistant Chrome extension from scratch. Handles customer message replies for two Etsy shops (charmoodle, pearpebbears) using local keyword matching with Claude Haiku API fallback.

### Technical Breakdown

**Architecture:**
- Chrome Extension Manifest V3
- Content script injected on `https://www.etsy.com/messages/*`
- Background service worker for Claude API calls
- No external dependencies, no build step

**API / Model:**
- Claude Haiku (`claude-haiku-4-5-20251001`) via Anthropic Messages API (`https://api.anthropic.com/v1/messages`)
- Header: `anthropic-dangerous-direct-browser-access: true` (required for browser-side API calls)
- API only called when user clicks "Ask Claude" button (approval gate)
- Estimated cost: ~$0.02/day at 12 messages/day (most handled locally)

**Local Keyword Matching (content.js):**
- `tryLocalMatch()` — checks customer message against keyword patterns
- Gift flow detection: "free gift", "extra gift", "bonus", "reviewed", etc.
- Product detection: reads `document.body.innerText` to find product names from page
- Review count: regex `Reviews\s+(\d+)` against page text
- Item count: regex `(\d+)\s*items?` for multiple-item detection
- Smart quote normalization: `\u2018\u2019\u2032` → straight apostrophe
- Shortcuts: `?` → clarify, `ss` → screenshot

**Gift Flow Logic (content.js:156-205):**
- Checks item count (single vs multiple) → charmoodle multiple items default to UGC Playbook
- Checks review count from page → 0 reviews shows "no review reminder" with Alt to swap to gift
- Pluralizes "review/reviews" based on actual review count
- Matches product to correct gift group via keywords and product name substring matching

**Product-Gift Mappings (responses.js):**
- `PRODUCT_GIFT_MAP` object keyed by shop name
- Each group: products[], keywords[], drive_links{}, first_message, gift_message, gift_name
- Drive links per individual product for download help flow

**Panel UI (content.js):**
- Draggable via mousedown/mousemove/mouseup on header with `requestAnimationFrame`
- Quick dropdown menu: Clarify, Drive Link, No Review Reminder
- Alt button for responses with alternatives (refund flow)
- Insert button: uses `HTMLTextAreaElement.prototype.value` setter + input/change events
- Collapse/expand via header click

**Background Worker (background.js):**
- Receives message from content script via `chrome.runtime.sendMessage`
- Builds system prompt with all templates + product-gift mappings
- Strips markdown code fences from Claude response before JSON.parse
- Error handling for extension context invalidation

**Key Decisions:**
- Dropped DOM auto-detection of customer messages (Etsy DOM too obfuscated) → paste-based input
- `document.body.innerText` for product detection (reliable, reads entire visible page)
- Auto-expand Order History/Reviews dropdowns via button click simulation
- Local matching first, API only with user approval (token cost control)

### Files Modified
- `manifest.json` — Created, URL pattern: `https://www.etsy.com/messages/*`
- `content.js` — Created, 400+ lines: keyword matching, gift flow, panel UI, drag
- `content.css` — Created, panel/dropdown/button styles
- `responses.js` — Created, 40+ templates, product-gift mappings, Drive links
- `background.js` — Created, Claude API integration with JSON fence stripping
- `popup.html` / `popup.js` — Created, API key settings
- `icons/` — Generated via Python PIL (orange circle + white E)

### Git
- Repo: `github.com/charmoodle/etsy_simple_message`
- Branch: `main`
- SSH: `git@github.com-charmoodle` (uses `~/.ssh/id_ed25519_dwa_m3_github`)
- Initial commit: `05638ed`
