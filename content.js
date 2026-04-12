// Etsy Message Assistant - Content Script
// Reads customer messages from Etsy's DOM, gets AI suggestions, inserts replies

(function () {
  "use strict";

  let panel = null;
  let lastProcessedMessage = "";
  let isEditing = false;

  // ── Detect shop name from page ──
  function getShopName() {
    // Look for shop links in the sidebar/nav
    const shopLinks = document.querySelectorAll('a[href*="/shop/"]');
    for (const link of shopLinks) {
      const m = link.href.match(/\/shop\/([^/?]+)/);
      if (m) return m[1].toLowerCase();
    }
    // Try the seller badge area
    const sellerBadge = document.querySelector('[class*="seller-badge"], [class*="shop-name"]');
    if (sellerBadge) return sellerBadge.textContent.trim().toLowerCase();
    return "unknown";
  }

  // Message auto-detection removed — paste is more reliable on Etsy's DOM

  // ── Get review count from the Reviews section on the page ──
  function getReviewCount() {
    // Look for "Reviews X" text in the sidebar
    const allText = document.body.innerText;
    const reviewMatch = allText.match(/Reviews\s+(\d+)/i);
    if (reviewMatch) return parseInt(reviewMatch[1]);
    return 0;
  }

  // ── Extract product/order info from the page ──
  function getProductInfo() {
    // Grab all visible text from the page — the product name is somewhere on it
    // More reliable than guessing specific CSS selectors
    return document.body.innerText.substring(0, 3000);
  }

  function findElementByText(searchText) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim().includes(searchText)) {
        return walker.currentNode.parentElement;
      }
    }
    return null;
  }

  // ── Get customer name from conversation header ──
  function getCustomerName() {
    // The customer name appears as a heading in the conversation
    // From screenshot: "Muhammad Manazer Hussain" appears as the header
    const headings = document.querySelectorAll('h1, h2, h3, [class*="wt-text-title"]');
    for (const h of headings) {
      const text = h.textContent.trim();
      // Skip "Messages" heading and other UI headings
      if (text === "Messages" || text === "Shop Manager") continue;
      if (text.length > 2 && text.length < 60 && !text.includes("order") && !text.includes("Order")) {
        return text;
      }
    }
    return null;
  }

  // ── Create the floating panel ──
  function createPanel() {
    if (panel) return;

    const shopName = getShopName();

    panel = document.createElement("div");
    panel.id = "ema-panel";
    panel.innerHTML = `
      <div id="ema-header">
        <span>Message Assistant <span class="ema-shop-badge">${shopName}</span></span>
        <span class="ema-toggle">▼</span>
      </div>
      <div id="ema-body">
        <div id="ema-input-area">
          <textarea id="ema-input" placeholder="Paste customer message here..." rows="2"></textarea>
          <div id="ema-btn-row">
            <button id="ema-go-btn">Get Response</button>
            <div id="ema-quick-menu">
              <button id="ema-quick-btn">Quick ▾</button>
              <div id="ema-quick-dropdown">
                <div class="ema-quick-option" data-action="clarify">Ask to Clarify</div>
                <div class="ema-quick-option" data-action="drive">Drive Link</div>
                <div class="ema-quick-option" data-action="noreview">No Review Reminder</div>
              </div>
            </div>
          </div>
        </div>
        <div id="ema-result-area">
          <div id="ema-empty">Paste customer message and click "Get Response"</div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Toggle collapse
    document.getElementById("ema-header").addEventListener("click", () => {
      panel.classList.toggle("ema-collapsed");
    });

    // Handle submit button
    document.getElementById("ema-go-btn").addEventListener("click", () => {
      const input = document.getElementById("ema-input");
      const msg = input.value.trim();
      if (msg) submitMessage(msg);
    });

    // Quick dropdown toggle
    const quickBtn = document.getElementById("ema-quick-btn");
    const quickDropdown = document.getElementById("ema-quick-dropdown");
    quickBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      quickDropdown.classList.toggle("ema-show");
    });
    // Close dropdown when clicking elsewhere
    document.addEventListener("click", () => {
      quickDropdown.classList.remove("ema-show");
    });

    // Quick dropdown actions
    document.querySelectorAll(".ema-quick-option").forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        quickDropdown.classList.remove("ema-show");
        const action = opt.dataset.action;

        if (action === "clarify") {
          showSuggestion({
            response: `Hi! Thanks for reaching out. To make sure I provide the most helpful information, could you share a few more details about what you're looking for?\n\nI want to ensure I'm on the right track before we get started!`,
            confidence: "high", type: "template", matched_template: "quick_clarify", note: null
          }, "");
        }

        if (action === "noreview") {
          showSuggestion({
            response: `Hi! I hope you're enjoying your order. Just a quick reminder — the free gift is sent after the 5-star review. You can leave it under your Etsy account → Purchases & Reviews → your order → Leave a Review. Once it's posted, let me know and I'll send your gift right away.`,
            confidence: "high", type: "template", matched_template: "no_review_reminder", note: null
          }, "");
        }

        if (action === "drive") {
          const shopName = getShopName();
          const productInfo = (getProductInfo() || "").toLowerCase();
          const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
          let foundLink = null, foundName = null;

          for (const group of shopGiftMap) {
            if (!group.drive_links) continue;
            for (const [prodName, link] of Object.entries(group.drive_links)) {
              if (productInfo.includes(prodName.toLowerCase().substring(0, 20))) {
                foundLink = link;
                foundName = prodName.split("|")[0].trim();
                break;
              }
            }
            if (foundLink) break;
            for (const kw of (group.keywords || [])) {
              if (productInfo.includes(kw.toLowerCase())) {
                foundLink = Object.values(group.drive_links)[0];
                foundName = Object.keys(group.drive_links)[0].split("|")[0].trim();
                break;
              }
            }
            if (foundLink) break;
          }

          if (foundLink) {
            showSuggestion({
              response: `Hi! Thanks for reaching out. I've set up a Google Drive link for your purchase so you can download easily.\n\n${foundName}\n${foundLink}\n\nPlease feel free to let me know if you have any other questions :)`,
              confidence: "high", type: "drive_link", matched_template: "google_drive_link",
              note: `Detected: ${foundName}`
            }, "");
          } else {
            showSuggestion({
              response: "", confidence: "low", type: "drive_link", matched_template: null,
              note: "Could not detect the product from this page. Make sure Order History is expanded."
            }, "");
          }
        }
      });
    });

    // Make panel draggable
    makeDraggable(panel);

    // Cmd/Ctrl+Enter to submit
    document.getElementById("ema-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById("ema-go-btn").click();
      }
    });
  }

  // ── LOCAL keyword matching (no API needed for 90% of messages) ──
  function tryLocalMatch(msg, shopName) {
    // Normalize smart quotes/apostrophes to straight ones
    const lower = msg.toLowerCase().trim()
      .replace(/[\u2018\u2019\u2032]/g, "'")
      .replace(/[\u201C\u201D\u2033]/g, '"');
    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    const productInfo = (getProductInfo() || "").toLowerCase();

    // --- GIFT FLOW ---
    const giftKeywords = ["free gift", "extra gift", "gift", "bonus", "left a review", "wrote a review",
      "reviewed", "i reviewed", "5 star", "five star", "posted review", "done review"];
    if (giftKeywords.some(kw => lower.includes(kw))) {
      // Check for multiple items in charmoodle — use UGC Playbook
      const multipleItemsMatch = productInfo.match(/(\d+)\s*items?/i);
      const itemCount = multipleItemsMatch ? parseInt(multipleItemsMatch[1]) : 1;

      let matchedGroup = shopGiftMap[0]; // default to first group

      if (shopName === "charmoodle" && itemCount > 1) {
        // Multiple items → use the multiple_items_fallback group (UGC Playbook)
        const fallback = shopGiftMap.find(g => g.is_multiple_items_fallback);
        if (fallback) matchedGroup = fallback;
      } else {
        // Single item — find matching product group from order info
        for (const group of shopGiftMap) {
          if (group.is_multiple_items_fallback) continue;
          for (const kw of (group.keywords || [])) {
            if (productInfo.includes(kw.toLowerCase())) {
              matchedGroup = group;
              break;
            }
          }
          for (const prod of (group.products || [])) {
            if (productInfo.includes(prod.toLowerCase().substring(0, 20))) {
              matchedGroup = group;
              break;
            }
          }
        }
      }
      if (matchedGroup && matchedGroup.gift_message) {
        let giftMsg = matchedGroup.gift_message;

        // Check actual review count from the Reviews section on the page
        const reviewCount = getReviewCount();

        // Only pluralize gift message if they actually wrote multiple reviews
        if (reviewCount > 1) {
          giftMsg = giftMsg
            .replace("taking the time to write a review", "taking the time to write reviews")
            .replace("write a review", "write reviews");
        }

        // No review detected → show "gift is after review" reminder instead
        if (reviewCount === 0) {
          return {
            response: `Hi! Thanks for reaching out. The extra gift is sent after the 5-star review, as mentioned in the note. To leave a review, just go to your Etsy account → Purchases & Reviews → find your order → tap Leave a Review. Once it's posted, let me know and I'll send your gift right away!`,
            confidence: "high",
            type: "template",
            matched_template: "review_gift_after_review",
            note: "No review detected on the page. Showing reminder. Click [Alt] if they actually did leave a review.",
            alternative: {
              response: giftMsg,
              confidence: "high",
              type: "gift_send",
              matched_template: "gift_flow",
              note: "VERIFY: Check that the customer actually left a 5-star review before sending this gift message"
            }
          };
        }

        // Review detected → show gift message
        let noteMsg = "VERIFY: Review detected but check that it's 5 stars before sending.";
        if (itemCount > 1 && reviewCount < itemCount) {
          noteMsg = `VERIFY: Customer has ${itemCount} items but only ${reviewCount} review(s). Check if they reviewed all orders and that all are 5 stars.`;
        } else if (itemCount > 1) {
          noteMsg = `VERIFY: Customer has ${itemCount} items and ${reviewCount} reviews. Check that ALL are 5 stars before sending.`;
        }

        return {
          response: giftMsg,
          confidence: "high",
          type: "gift_send",
          matched_template: "gift_flow",
          note: noteMsg
        };
      }
    }

    // --- REVIEW NOT SHOWING ---
    if ((lower.includes("review") && (lower.includes("not showing") || lower.includes("not see") || lower.includes("can't see"))) ||
        lower.includes("where is my review")) {
      return matchTemplate("review_not_posted_yet");
    }

    // --- HOW TO LEAVE REVIEW ---
    if (lower.includes("how") && lower.includes("review")) {
      return matchTemplate("review_how_to");
    }

    // --- CAN'T LEAVE REVIEW ---
    if ((lower.includes("can't") || lower.includes("cant") || lower.includes("cannot") || lower.includes("unable")) && lower.includes("review")) {
      return matchTemplate("review_cant_leave");
    }

    // --- DOWNLOAD HELP ---
    if (lower.includes("download") || lower.includes("can't access") || lower.includes("cant access") ||
        lower.includes("where are my files") || lower.includes("didn't get") || lower.includes("didnt get") ||
        lower.includes("how do i get the files") || lower.includes("lost my files") ||
        lower.includes("haven't received") || lower.includes("havent received") || lower.includes("didn't receive") ||
        lower.includes("didnt receive") || lower.includes("not received") || lower.includes("give me") ||
        lower.includes("no mail") || lower.includes("no email") || lower.includes("don't received") ||
        lower.includes("dont received") || lower.includes("didn't get mail") || lower.includes("didn't get email") ||
        lower.includes("received any mail") || lower.includes("received mail") || lower.includes("received email") ||
        lower.includes("any mail") || lower.includes("get my files")) {
      // Check if we can provide a specific drive link
      if (shopGiftMap.length > 0) {
        for (const group of shopGiftMap) {
          if (!group.drive_links) continue;
          for (const kw of (group.keywords || [])) {
            if (productInfo.includes(kw.toLowerCase())) {
              // Find specific product drive link
              for (const [prodName, link] of Object.entries(group.drive_links)) {
                if (productInfo.includes(prodName.toLowerCase().substring(0, 20))) {
                  // Shorten product name (first part before |)
                  const shortName = prodName.split("|")[0].trim();
                  return {
                    response: `Hi! Thanks for reaching out. I've set up a Google Drive link for your purchase so you can download easily.\n\n${shortName}\n${link}\n\nPlease feel free to let me know if you have any other questions :)`,
                    confidence: "high",
                    type: "drive_link",
                    matched_template: "google_drive_link",
                    note: null
                  };
                }
              }
              // Use first drive link in the group
              const firstProdName = Object.keys(group.drive_links)[0];
              const firstLink = Object.values(group.drive_links)[0];
              if (firstLink) {
                const shortName = firstProdName.split("|")[0].trim();
                return {
                  response: `Hi! Thanks for reaching out. I've set up a Google Drive link for your purchase so you can download easily.\n\n${shortName}\n${firstLink}\n\nPlease feel free to let me know if you have any other questions :)`,
                  confidence: "medium",
                  type: "drive_link",
                  matched_template: "google_drive_link",
                  note: "Could not determine exact product — verify this is the correct Drive link"
                };
              }
            }
          }
        }
      }
      return matchTemplate("how_to_download");
    }

    // --- ZIP FILE ---
    if (lower.includes("zip") || lower.includes("unzip") || lower.includes("extract")) {
      return matchTemplate("zip_file_help");
    }

    // --- SHIPPING CONFUSION ---
    if (lower.includes("ship") || lower.includes("tracking") || lower.includes("arrive") || lower.includes("delivery")) {
      return matchTemplate("digital_no_shipping");
    }

    // --- TEXT EDITABLE ---
    if ((lower.includes("change") || lower.includes("edit") || lower.includes("modify") || lower.includes("customize")) &&
        (lower.includes("text") || lower.includes("word") || lower.includes("language") || lower.includes("german") || lower.includes("spanish") || lower.includes("french"))) {
      return matchTemplate("text_editable_canva");
    }

    // --- CANVA HELP ---
    if (lower.includes("canva")) {
      if (lower.includes("share") || lower.includes("link")) return matchTemplate("canva_share_template_link");
      if (lower.includes("pro") || lower.includes("premium")) return matchTemplate("canva_pro_elements_fix");
      return matchTemplate("canva_how_to_edit");
    }
    // Only match "edit"/"template"/"how to use" for Canva if the message is short and clearly about editing
    if ((lower.includes("how to edit") || lower.includes("how do i edit") || lower.includes("how to use template")) && lower.length < 80) {
      return matchTemplate("canva_how_to_edit");
    }

    // --- RESELL / MRR / PLR ---
    if (lower.includes("resell") || lower.includes("mrr") || lower.includes("plr") || lower.includes("sell this") ||
        lower.includes("can i sell") || lower.includes("rights") || lower.includes("rebrand") ||
        lower.includes("re sell") || lower.includes("re-sell") || lower.includes("other platform") || lower.includes("allowed to sell")) {
      if (lower.includes("photo") || lower.includes("listing") || lower.includes("image")) return matchTemplate("own_listing_photos");
      if (lower.includes("price") || lower.includes("how much")) return matchTemplate("pricing_resell");
      return matchTemplate("mrr_plr_detailed");
    }

    // --- REFUND (two options: nice vs not nice customer) ---
    if (lower.includes("refund") || lower.includes("money back")) {
      return {
        response: `Hi! Thanks for reaching out. I've gone ahead and processed your refund.`,
        confidence: "high",
        type: "template",
        matched_template: "refund_processed",
        note: "Nice customer — refund processed. Click the blue [Alt] button below to switch response.",
        alternative: {
          response: `Hi! Thanks for reaching out. I'm sorry to hear about that. Could you please let me know what went wrong so I can better assist you?`,
          confidence: "high",
          type: "template",
          matched_template: "refund_ask_reason",
          note: "Difficult customer — ask what went wrong. Click the blue [Alt] button below to switch response."
        }
      };
    }

    // --- SCAM ---
    if (lower.includes("scam") || lower.includes("fake") || lower.includes("rip off") || lower.includes("fraud")) {
      return matchTemplate("scam_accusation");
    }

    // --- PAYMENT ISSUES ---
    if (lower.includes("payment") || lower.includes("pay") || lower.includes("charged") || lower.includes("canceled")) {
      return matchTemplate("payment_failed");
    }

    // --- QUALITY / PIXELATION ---
    if (lower.includes("blurry") || lower.includes("pixelat") || lower.includes("low quality") || lower.includes("bad quality")) {
      return matchTemplate("pixelation_drive_preview");
    }

    // --- VIDEO QUALITY ---
    if (lower.includes("video") && (lower.includes("quality") || lower.includes("pixel") || lower.includes("clear"))) {
      return matchTemplate("video_quality");
    }

    // --- VIDEO LENGTH ---
    if (lower.includes("how long") || lower.includes("duration") || lower.includes("seconds")) {
      return matchTemplate("video_length");
    }

    // --- WHAT IS THIS PRODUCT ---
    if (lower.includes("what is") || lower.includes("what are") || lower.includes("what did i buy")) {
      // Check product info to give a relevant answer
      if (productInfo.includes("faceless") || productInfo.includes("reel")) {
        return matchTemplate("faceless_reels_explain");
      }
      // For other products, ask for clarification with screenshot
      return matchTemplate("ask_screenshot");
    }

    // --- HOW TO USE ON SOCIAL MEDIA ---
    if ((lower.includes("how") || lower.includes("use")) && (lower.includes("instagram") || lower.includes("tiktok") || lower.includes("social media") || lower.includes("post"))) {
      return matchTemplate("how_to_use_instagram");
    }

    // --- BUNDLES DIFFERENT ---
    if (lower.includes("same") || lower.includes("different") || lower.includes("duplicate") || lower.includes("overlap")) {
      return matchTemplate("bundles_not_same");
    }

    // --- THANK YOU ---
    if (lower.includes("thank") || lower.includes("love it") || lower.includes("amazing") || lower.includes("great") || lower.includes("awesome")) {
      return matchTemplate("thank_you_response");
    }

    // --- SVG SMALL ---
    if (lower.includes("svg") && (lower.includes("small") || lower.includes("tiny"))) {
      return matchTemplate("svg_looks_small");
    }

    // --- SHORTCUT: type "?" or "clarify" or "screenshot" for quick templates ---
    if (lower === "?" || lower === "clarify" || lower === "unclear") {
      return matchTemplate("ask_clarify");
    }
    if (lower === "screenshot" || lower === "ss") {
      return matchTemplate("ask_screenshot");
    }

    // --- NOT WORKING (default: ask for screenshot) ---
    if (lower.includes("not working") || lower.includes("doesn't work") || lower.includes("doesnt work") ||
        lower.includes("broken") || lower.includes("error") || lower.includes("issue") || lower.includes("problem") ||
        lower.includes("help") || lower.includes("cant open") || lower.includes("can't open")) {
      return matchTemplate("ask_screenshot");
    }

    // No local match found
    return null;
  }

  function matchTemplate(templateId) {
    const tmpl = RESPONSE_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return null;
    return {
      response: tmpl.template,
      confidence: "high",
      type: "template",
      matched_template: templateId,
      note: null
    };
  }

  // ── Submit message — try local first, then API ──
  function submitMessage(customerMsg) {
    lastProcessedMessage = customerMsg;

    const shopName = getShopName();

    // Try local matching first (FREE, instant)
    const localResult = tryLocalMatch(customerMsg, shopName);
    if (localResult) {
      showSuggestion(localResult, customerMsg);
      return;
    }

    // No local match — ask user before using Claude API
    const resultArea = document.getElementById("ema-result-area");
    resultArea.innerHTML = `
      <div id="ema-no-match">
        <div style="font-size:13px;color:#666;margin-bottom:8px;">No local match found for this message.</div>
        <div style="font-size:12px;color:#999;margin-bottom:10px;">Ask Claude AI to generate a response? (uses API tokens)</div>
        <div id="ema-actions">
          <button id="ema-ask-claude-btn" style="flex:1;padding:8px 12px;background:#f56400;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;">Ask Claude (uses tokens)</button>
          <button id="ema-skip-btn" style="flex:1;padding:8px 12px;background:#f0f0f0;color:#444;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;">Skip</button>
        </div>
      </div>
    `;

    document.getElementById("ema-ask-claude-btn").addEventListener("click", () => {
      resultArea.innerHTML = `
        <div id="ema-loading">
          <div class="ema-spinner"></div>
          <span>Asking Claude...</span>
        </div>
      `;
      callClaudeAPI(customerMsg, shopName);
    });

    document.getElementById("ema-skip-btn").addEventListener("click", () => {
      resultArea.innerHTML = `<div id="ema-empty">Skipped. You can also try the "ask for screenshot" approach — just paste "screenshot" and click Get Response.</div>`;
    });
  }

  // ── Call Claude API (only when user approves) ──
  function callClaudeAPI(customerMsg, shopName) {
    // Check if extension context is still valid
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      showError("Extension was updated. Please reload this Etsy page (Cmd+R) and try again.");
      return;
    }

    const productInfo = getProductInfo();
    const customerName = getCustomerName();
    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];

    try {
      chrome.runtime.sendMessage(
        {
          type: "GET_SUGGESTION",
          customerMessage: customerMsg,
          shopName: shopName,
          productInfo: productInfo,
          customerName: customerName,
          templates: RESPONSE_TEMPLATES,
          productGiftMap: shopGiftMap
        },
        (result) => {
          if (chrome.runtime.lastError) {
            showError("Extension disconnected. Please reload this page (Cmd+R).");
            return;
          }
          if (result.error) {
            showError(result.error);
            return;
          }
          if (result.suggestion) {
            showSuggestion(result.suggestion, customerMsg);
          }
        }
      );
    } catch (e) {
      showError("Extension disconnected. Please reload this page (Cmd+R).");
    }
  }

  // ── Show error ──
  function showError(msg) {
    const resultArea = document.getElementById("ema-result-area");
    resultArea.innerHTML = `<div id="ema-error">${msg}</div>`;
  }

  // ── Show suggestion ──
  function showSuggestion(suggestion, customerMsg) {
    const resultArea = document.getElementById("ema-result-area");
    renderSuggestion(resultArea, suggestion, customerMsg);
  }

  function renderSuggestion(resultArea, suggestion, customerMsg) {
    const { response, confidence, type, note, alternative } = suggestion;

    const confidenceClass = confidence || "medium";
    const typeLabel = type === "gift_first_message" ? "review request"
      : type === "gift_send" ? "gift message"
      : type === "template" ? "template match"
      : type === "drive_link" ? "drive link"
      : "custom";

    let html = "";

    if (note) {
      html += `<div id="ema-note">${escapeHtml(note)}</div>`;
    }

    html += `<span class="ema-confidence ${confidenceClass}">${confidenceClass} confidence</span>`;
    html += `<span class="ema-type-badge">${typeLabel}</span>`;
    html += `<div id="ema-response">${escapeHtml(response)}</div>`;
    html += `
      <div id="ema-actions">
        <button id="ema-insert-btn" title="Insert into Etsy reply box">Insert</button>
        <button id="ema-copy-btn" title="Copy to clipboard">Copy</button>
        <button id="ema-edit-btn" title="Edit before inserting">Edit</button>
        ${alternative ? '<button id="ema-alt-btn" title="Switch to alternative response">Alt</button>' : ''}
      </div>
    `;

    resultArea.innerHTML = html;

    document.getElementById("ema-insert-btn").addEventListener("click", () => {
      const text = document.getElementById("ema-response").textContent;
      insertIntoReplyBox(text);
    });

    document.getElementById("ema-copy-btn").addEventListener("click", () => {
      const text = document.getElementById("ema-response").textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("ema-copy-btn");
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      });
    });

    document.getElementById("ema-edit-btn").addEventListener("click", () => {
      const responseEl = document.getElementById("ema-response");
      const editBtn = document.getElementById("ema-edit-btn");
      if (responseEl.contentEditable === "true") {
        responseEl.contentEditable = "false";
        editBtn.textContent = "Edit";
        isEditing = false;
      } else {
        responseEl.contentEditable = "true";
        responseEl.focus();
        editBtn.textContent = "Done";
        isEditing = true;
      }
    });

    // Alt button — swap to alternative response
    if (alternative) {
      document.getElementById("ema-alt-btn").addEventListener("click", () => {
        // Swap: current becomes alt's alternative
        const swapped = { ...alternative, alternative: suggestion };
        delete swapped.alternative.alternative; // prevent infinite nesting
        // Re-store the original for toggling back
        swapped.alternative = { ...suggestion };
        delete swapped.alternative.alternative;
        renderSuggestion(resultArea, swapped, customerMsg);
      });
    }
  }

  // ── Insert text into Etsy's reply textarea ──
  function insertIntoReplyBox(text) {
    const replyBox = document.querySelector(
      'textarea[placeholder*="reply" i], ' +
      'textarea[placeholder*="Reply"], ' +
      'textarea[name="message"], ' +
      'textarea:not(#ema-input)'
    );

    if (replyBox) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, "value"
      ).set;
      nativeInputValueSetter.call(replyBox, text);
      replyBox.dispatchEvent(new Event("input", { bubbles: true }));
      replyBox.dispatchEvent(new Event("change", { bubbles: true }));
      replyBox.focus();

      const btn = document.getElementById("ema-insert-btn");
      btn.textContent = "Inserted!";
      btn.style.background = "#2e7d32";
      setTimeout(() => {
        btn.textContent = "Insert";
        btn.style.background = "";
      }, 1500);
    } else {
      navigator.clipboard.writeText(text);
      const btn = document.getElementById("ema-insert-btn");
      btn.textContent = "Copied! (paste manually)";
      setTimeout(() => { btn.textContent = "Insert"; }, 2000);
    }
  }

  // ── Auto-click Order History and Reviews dropdowns ──
  function expandDropdowns() {
    // Find clickable dropdown headers by looking for text + arrow indicators
    const allClickables = document.querySelectorAll(
      'button, [role="button"], [class*="wt-btn"], summary, [class*="toggle"], [class*="collapse"]'
    );

    allClickables.forEach((el) => {
      const text = el.textContent.trim();
      // Click "Order history" dropdown if it's collapsed
      if (text.includes("Order history") || text.includes("Reviews")) {
        // Check if it has an aria-expanded attribute
        const expanded = el.getAttribute("aria-expanded");
        if (expanded === "false" || expanded === null) {
          el.click();
        }
      }
    });

    // Also try: Etsy uses wt-disclosure elements
    const disclosures = document.querySelectorAll('[class*="wt-disclosure"], [class*="wt-collapse"]');
    disclosures.forEach((el) => {
      const text = el.textContent.trim();
      if (text.includes("Order history") || text.includes("Reviews")) {
        const trigger = el.querySelector('button, [role="button"], summary, [class*="trigger"]');
        if (trigger) {
          const expanded = trigger.getAttribute("aria-expanded");
          if (expanded === "false") {
            trigger.click();
          }
        }
      }
    });
  }


  // ── Make panel draggable by its header ──
  function makeDraggable(el) {
    const header = document.getElementById("ema-header");
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("ema-toggle")) return;
      isDragging = true;
      const rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      el.style.transition = "none";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      requestAnimationFrame(() => {
        el.style.left = (e.clientX - offsetX) + "px";
        el.style.top = (e.clientY - offsetY) + "px";
        el.style.right = "auto";
        el.style.bottom = "auto";
      });
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        el.style.transition = "";
      }
    });
  }

  // ── Utility ──
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Initialize ──
  function init() {
    setTimeout(() => {
      createPanel();

      // Auto-click Order History / Reviews dropdowns to reveal product info
      expandDropdowns();

      // Re-expand when conversation changes (user clicks different convo)
      let lastUrl = location.href;
      const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
          lastUrl = location.href;
          lastProcessedMessage = "";
          const input = document.getElementById("ema-input");
          if (input) input.value = "";
          const resultArea = document.getElementById("ema-result-area");
          if (resultArea) resultArea.innerHTML = "";
          // Expand dropdowns for the new conversation
          setTimeout(expandDropdowns, 1000);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
