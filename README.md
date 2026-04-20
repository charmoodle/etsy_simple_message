# Etsy Message Assistant

Chrome extension for faster Etsy customer message replies across two shops (charmoodle & pearpebbears).

## How It Works

1. Install extension in Chrome (Load unpacked from this folder)
2. Set Claude API key in extension popup (only needed for 10% custom messages)
3. Open any Etsy conversation at `etsy.com/messages/*`
4. Paste customer message, click "Get Response"
5. Review suggestion, click Insert, manually hit Send

## Features

- **Local keyword matching** — 90% of messages handled instantly, free, no API
- **Claude Haiku fallback** — 10% custom messages, requires user approval before spending tokens
- **Gift flow** — detects product from page, checks review count, sends correct gift link per product group
- **Google Drive links** — product-specific backup download links
- **Quick dropdown** — Clarify, Drive Link, No Review Reminder shortcuts
- **Alt responses** — toggle between two options (e.g., refund: nice vs difficult customer)
- **Draggable panel** — grab header to reposition
- **Two-shop support** — auto-detects charmoodle vs pearpebbears

## Shops & Product Groups

### charmoodle
| Product Group | Gift | Emoji |
|---|---|---|
| Small Bundles (10M, 25M, 85M, Faceless Reels, Motherhood) | 500 Digital Products to Sell Ebook | strawberry |
| Carousel Products (400+, Instagram Templates, Pink) | 500 Carousel Stickers | strawberry |
| Carousel Stickers (Instagram Trending Carousel Stickers) | 100 Reels Templates | strawberry |
| Big Bundles (DFY Vault, Course, Passive Income) | UGC Playbook | strawberry |
| Multiple items | UGC Playbook | strawberry |

### pearpebbears
| Product Group | Gift | Emoji |
|---|---|---|
| Bridal Products | Wedding Newspaper Template | bear |
| Winnie the Pooh | Holiday Theme Classic Pooh PNG | bear |
| Snoopy | 120 Snoopy PNG and SVG | bear |
| Princess | Princess Bingo Card Game | bear |

## Files

- `manifest.json` — Chrome extension config, targets 3 URL patterns
- `content.js` — Message Assistant (orange): keyword matching, gift flow, panel UI, drag, teach/saved responses
- `content.css` — Message Assistant styling
- `review_request.js` / `review_request.css` — Review Request panel (green) for completed orders page
- `gift_sender.js` / `gift_sender.css` — Gift Sender panel (purple) for shop reviews page
- `responses.js` — All response templates + product-to-gift mappings + Drive links (shared across panels)
- `background.js` — Claude Haiku API calls (fallback only, messages page)
- `popup.html/js` — API key settings

## Status

**v2.0 — Three-panel system.** Deployed to both Chrome profiles (charmoodle & pearpebbears).

- **1. Message Assistant** (orange) on `etsy.com/messages/*` — reply to customer messages
- **2. Review Request** (green) on `etsy.com/your/orders/sold/completed*` — ask buyers for reviews
- **3. Gift Sender** (purple) on `etsy.com/shop/*` (Reviews tab) — send free gifts after reviews

## Panels Overview

| Panel | Page | Color | What it does |
|---|---|---|---|
| Message Assistant | `/messages/*` | Orange | Local keyword matching + Claude fallback + saved responses + teach new |
| Review Request | `/your/orders/sold/completed*` | Green | Dropdown selector + auto-detect product + auto-click Message Buyer |
| Gift Sender | `/shop/*` | Purple | Dropdown selector + auto-detect product from review/conversation |

## User-Taught Responses

Teach button (green) saves customer message → your reply pairs to `chrome.storage.local` (per shop). Auto-matches future similar messages via substring similarity (60% word overlap threshold). Export/Import JSON for backup or syncing between Chrome profiles.

## Next Steps

**Wrapping up.** Extension is feature-complete for current two-shop workflow. No active development planned; any follow-ups below are nice-to-haves only.

- [ ] (future) Add "can't refund" as third Alt option on refund responses
- [ ] (future) Bundle exported saved-responses JSON into `responses.js` permanently once tested
- [ ] (future) Improve auto-detect on pearpebbears for multi-item edge cases
- [ ] (future) Consider adding order age filter on review request (e.g. skip orders older than 60 days)
- [ ] (future) Add visual badges on the order list to flag ineligible orders (cancelled, guest, existing review) without needing to click each one
