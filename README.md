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
| Digital Products Bundles (10M, 25M, 85M, Faceless Reels, Motherhood) | 500 Digital Products to Sell Ebook | strawberry |
| Carousel Products (400+, Instagram, Stickers, Pink) | 500 Carousel Stickers | strawberry |
| Marketing Bundles (DFY Vault, Course, Passive Income) | UGC Playbook | strawberry |
| Multiple items | UGC Playbook | strawberry |

### pearpebbears
| Product Group | Gift | Emoji |
|---|---|---|
| Bridal Products | Wedding Newspaper Template | bear |
| Winnie the Pooh | Holiday Theme Classic Pooh PNG | bear |
| Snoopy | 120 Snoopy PNG and SVG | bear |
| Princess | Princess Bingo Card Game | bear |

## Files

- `manifest.json` — Chrome extension config, targets `etsy.com/messages/*`
- `content.js` — Main logic: keyword matching, gift flow, panel UI, drag
- `content.css` — Panel styling
- `responses.js` — All response templates + product-to-gift mappings + Drive links
- `background.js` — Claude Haiku API calls (fallback only)
- `popup.html/js` — API key settings

## Status

**v1.0 — Complete and functional.** Deployed to both Chrome profiles (charmoodle & pearpebbears). Handles message replies on `etsy.com/messages/*`.

## Next Steps

- [ ] Build review request feature for completed orders page (`etsy.com/your/orders/sold/completed`)
- [ ] Add the completed orders URL to manifest content_scripts
- [ ] New UI for sending first-message review requests to buyers
- [ ] Add "can't refund" as third Alt option on refund responses
- [ ] Consider auto-detection improvements if Etsy DOM becomes inspectable
