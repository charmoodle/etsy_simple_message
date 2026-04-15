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

---

## 2026-04-15: Review Request, Gift Sender, Teach/Saved Responses

### Summary
Expanded from single Message Assistant to a three-panel color-coded system covering the full seller workflow: message replies (orange), review requests on completed orders (green), and gift sending on shop reviews (purple). Added user-taught response storage with auto-matching, JSON export/import, and UX polish across all panels.

### Technical Breakdown

**Architecture:**
- Three content scripts, each scoped to its URL pattern in `manifest.json`
- Shared data: `responses.js` (RESPONSE_TEMPLATES + PRODUCT_GIFT_MAP) loaded by all three
- No new backend services — everything runs in the content script
- Saved responses persisted in `chrome.storage.local` (scoped per shop)

**New URL patterns added to `manifest.json`:**
- `https://www.etsy.com/your/orders/sold/completed*` → `review_request.js` + `review_request.css`
- `https://www.etsy.com/shop/*` → `gift_sender.js` + `gift_sender.css`

**Review Request panel (`review_request.js`):**
- Hybrid dropdown + auto-detect: dropdown is pre-populated from `PRODUCT_GIFT_MAP` filtered where `gift_name != null`
- `getDetailPanelText()` reads only the order detail panel (scoped to `[class*="order-detail"]`, `[role="dialog"]`, etc.) to avoid picking up other orders in the list
- `autoDetectGroup()` matches product names first (25-char substring), then keywords, then falls back to `is_multiple_items_fallback` when "N items" where N > 1
- Regex `/(\d+)\s*items?/` detects multi-item orders
- Regex `/\(Guest\)/i` detects guest checkouts
- `MutationObserver` watches for Receipt # changes to re-trigger auto-detect
- `autoClickMessageBuyer()` only fires when detail contains "No messages about this order yet" AND no guest checkout AND no "previous messages"/"Reply"/"See full conversation"
- Insert button blocks with `alert()` if guest detected

**Gift Sender panel (`gift_sender.js`):**
- Only appears on Reviews tab (detected via active tab aria attrs or presence of "Report this review"/"Contact buyer" in page text)
- Auto-detect prefers the conversation panel (right side overlay) over full page text to avoid cross-review contamination
- Dropdown filtered where `gift_message != null` (so "Wedding Newspaper" group is excluded)
- Insert targets the "Write a message" textarea in the conversation overlay

**Saved Responses (`content.js`):**
- `chrome.storage.local.savedResponses` shape: `{ [shopName]: [{ id, customerMessage, response, created }] }`
- `tokenize()` strips smart quotes, punctuation, STOPWORDS (60+ words), keeps tokens >2 chars
- `similarity()` = intersection / saved-message-token-count (Jaccard-ish, biased toward saved side so short stored messages don't match everything)
- Match threshold: 0.6 (60% word overlap)
- `submitMessage()` ordering: saved pairs → built-in `tryLocalMatch()` → Claude API fallback
- Export: `Blob` → `URL.createObjectURL` → auto-download as `etsy-saved-responses-YYYY-MM-DD.json`
- Import: merges by ID (imported wins on conflict)

**Message Assistant polish:**
- Replaced "high confidence · template match" badges with single orange title badge showing `RESPONSE_TEMPLATES[matched_template].description` (falls back to Title Case of the id)
- Quick dropdown additions: Send Gift, Click Link in Screenshot, Ask for Screenshot, Manage Saved Responses (orange styled)
- Separate green "+ Teach" button next to Get Response
- Teach form hides `#ema-input-area` so there aren't two customer message boxes; restores on Save/Cancel

**Product group changes (`responses.js`):**
- Renamed `digital_products_bundles` → `small_bundles`
- Renamed `marketing_bundles` → `big_bundles`
- Split `Instagram Trending Carousel Stickers` out of `carousel_products` into new `carousel_stickers` group with gift "100 Reels Templates" (Canva link `DAGBIPPnQmI/WasjBWbH0o_36lL3KYqr6g`)
- Tightened `carousel_products.keywords` to `"carousel template"`, `"pink instagram"`, `"faceless instagram carousel"` to prevent false matches with the new stickers group

**UI/UX:**
- All three panels: 285px wide (down from 380px), bottom-left, draggable, collapsible
- Panel titles numbered: "1. Message Assistant", "2. Review Request", "3. Gift Sender"
- Color scheme: orange (#f56400) / green (#2e7d32) / purple (#6a1b9a)
- Reminders: "Do not send to Guest Checkouts" (green panel), "Sort reviews by Most recent first" (purple panel)

### Files Modified
- `manifest.json` — added two content_scripts entries
- `content.js` — saved responses (~160 lines), teach form, manage list, new quick options, title badge
- `content.css` — title badge, teach form, saved list, export/import buttons, orange manage option
- `responses.js` — renamed groups, split carousel_stickers group
- `README.md` — v2.0 overview, three-panel table, updated files list, new Next Steps
- `SESSION_LOG.md` — this entry

### Files Created
- `review_request.js` / `review_request.css`
- `gift_sender.js` / `gift_sender.css`

### Left Off / Active State
- **No active API endpoints or in-flight network requests.** All new features run entirely client-side via `chrome.storage.local`.
- **Storage shape to remember:** `chrome.storage.local.savedResponses = { charmoodle: [...], pearpebbears: [...] }`
- **Similarity threshold** hardcoded at `0.6` in `content.js:matchSavedResponse()` — tune here if matches are too loose/tight.
- **Multiple-item fallback** only wired for charmoodle (pearpebbears has no `is_multiple_items_fallback` group yet).
- **Guest detection regex** is `/\(Guest\)/i` against detail panel text — assumes Etsy continues rendering the literal "(Guest)" label.
- Next session: consider bundling exported saved responses back into `responses.js` as built-in templates once the user has curated a good set.

### Git
- Session commits: `adc6fa0` (review request + gift sender panels), `0f135cb` (Send Gift quick option)
- Further uncommitted work: teach/saved responses, title badge, ask-for-screenshot, carousel_stickers split, guest checkout hard-blocking, reminders
