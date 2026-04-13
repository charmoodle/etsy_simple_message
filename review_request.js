// Etsy Review Request Assistant - Content Script
// Helps send review request messages on completed orders page

(function () {
  "use strict";

  let panel = null;
  let selectedGroupIndex = 0;

  // ── Detect shop name from page ──
  function getShopName() {
    const shopLinks = document.querySelectorAll('a[href*="/shop/"]');
    for (const link of shopLinks) {
      const m = link.href.match(/\/shop\/([^/?]+)/);
      if (m) return m[1].toLowerCase();
    }
    return "unknown";
  }

  // ── Try to read product info from the order detail panel only ──
  function getDetailPanelText() {
    // Etsy's order detail panel is on the right side
    // Try to find it by looking for the Receipt/Order details area
    // The panel typically contains "Order from", "Order details", "Receipt #"
    const candidates = document.querySelectorAll(
      '[class*="order-detail"], [class*="panel-body"], [class*="detail-panel"], ' +
      '[class*="wt-overlay"], [role="dialog"], [class*="receipt"]'
    );

    for (const el of candidates) {
      const text = el.innerText || "";
      if (text.includes("Receipt #") || text.includes("Order details")) {
        return text.substring(0, 3000);
      }
    }

    // Fallback: try to find the right-side content area
    // On Etsy completed orders, clicking an order opens details on the right
    // Look for elements that contain "Order from" + "Receipt"
    const allElements = document.querySelectorAll("div, section, aside");
    for (const el of allElements) {
      if (el.children.length < 2) continue;
      const text = el.innerText || "";
      if (text.includes("Receipt #") && text.includes("Order from") && text.length < 5000) {
        return text;
      }
    }

    return null;
  }

  // ── Auto-detect best matching group from detail panel text ──
  function autoDetectGroup(shopName, detailText) {
    if (!detailText) return -1;

    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    const lower = detailText.toLowerCase();

    // Check for multiple items first (e.g. "2 items", "3 items")
    const itemCountMatch = lower.match(/(\d+)\s*items?/);
    const itemCount = itemCountMatch ? parseInt(itemCountMatch[1]) : 1;

    if (itemCount > 1) {
      // Find the multiple_items_fallback group
      const fallbackIndex = shopGiftMap.findIndex(g => g.is_multiple_items_fallback);
      if (fallbackIndex >= 0) return fallbackIndex;
    }

    for (let i = 0; i < shopGiftMap.length; i++) {
      const group = shopGiftMap[i];
      if (group.is_multiple_items_fallback) continue;

      // Check product names (most specific match)
      for (const prod of (group.products || [])) {
        if (lower.includes(prod.toLowerCase().substring(0, 25))) {
          return i;
        }
      }
    }

    // Second pass: keywords
    for (let i = 0; i < shopGiftMap.length; i++) {
      const group = shopGiftMap[i];
      if (group.is_multiple_items_fallback) continue;

      for (const kw of (group.keywords || [])) {
        if (lower.includes(kw.toLowerCase())) {
          return i;
        }
      }
    }

    return -1;
  }

  // ── Build dropdown options for the shop ──
  function buildDropdownOptions(shopName) {
    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    let html = "";

    for (let i = 0; i < shopGiftMap.length; i++) {
      const group = shopGiftMap[i];
      if (!group.first_message || !group.gift_name) continue;

      // Build a readable label
      const giftLabel = ` → Gift: ${group.gift_name}`;
      const groupLabel = group.group.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

      html += `<option value="${i}">${groupLabel}${giftLabel}</option>`;
    }

    return html;
  }

  // ── Check order eligibility from detail panel ──
  function checkEligibility(detailText) {
    if (!detailText) return { status: "no_order", messages: ["Click on an order to see details"] };

    const messages = [];
    let status = "ok";

    if (detailText.includes("Cancelled") || detailText.includes("Canceled")) {
      messages.push("Order is cancelled");
      status = "warn";
    }

    // Check for guest checkout
    if (/\bguest\b/i.test(detailText)) {
      messages.push("Guest checkout — cannot leave reviews, skip!");
      status = "warn";
    }

    if (detailText.includes("No messages about this order yet")) {
      messages.push("No prior messages");
    } else if (detailText.includes("Message buyer")) {
      messages.push("Customer may have prior messages — check first");
      if (status === "ok") status = "caution";
    }

    return { status, messages };
  }

  // ── Create the floating panel ──
  function createPanel() {
    if (panel) return;

    const shopName = getShopName();
    const dropdownOptions = buildDropdownOptions(shopName);

    panel = document.createElement("div");
    panel.id = "ema-review-panel";
    panel.innerHTML = `
      <div id="ema-review-header">
        <span>2. Review Request <span class="ema-shop-badge">${shopName}</span></span>
        <span class="ema-toggle">▼</span>
      </div>
      <div id="ema-review-body">
        <div id="ema-review-selector">
          <label for="ema-group-select">Product Group:</label>
          <select id="ema-group-select">
            ${dropdownOptions}
          </select>
          <div id="ema-auto-detect-status"></div>
        </div>
        <div id="ema-review-eligibility"></div>
        <div id="ema-review-result">
          <div id="ema-review-response"></div>
          <div id="ema-review-actions">
            <button id="ema-review-insert-btn" title="Insert into message box">Insert</button>
            <button id="ema-review-copy-btn" title="Copy to clipboard">Copy</button>
            <button id="ema-review-edit-btn" title="Edit before inserting">Edit</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Toggle collapse
    document.getElementById("ema-review-header").addEventListener("click", (e) => {
      if (e.target.classList.contains("ema-toggle") || e.target === document.getElementById("ema-review-header")) {
        panel.classList.toggle("ema-collapsed");
      }
    });

    // Dropdown change → update message
    document.getElementById("ema-group-select").addEventListener("change", (e) => {
      selectedGroupIndex = parseInt(e.target.value);
      updateMessage();
    });

    // Insert button
    document.getElementById("ema-review-insert-btn").addEventListener("click", () => {
      const text = document.getElementById("ema-review-response").textContent;
      insertIntoMessageBox(text);
    });

    // Copy button
    document.getElementById("ema-review-copy-btn").addEventListener("click", () => {
      const text = document.getElementById("ema-review-response").textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("ema-review-copy-btn");
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      });
    });

    // Edit button
    document.getElementById("ema-review-edit-btn").addEventListener("click", () => {
      const responseEl = document.getElementById("ema-review-response");
      const editBtn = document.getElementById("ema-review-edit-btn");
      if (responseEl.contentEditable === "true") {
        responseEl.contentEditable = "false";
        editBtn.textContent = "Edit";
      } else {
        responseEl.contentEditable = "true";
        responseEl.focus();
        editBtn.textContent = "Done";
      }
    });

    // Make draggable
    makeDraggable(panel);

    // Show initial message for the default selected group
    updateMessage();
  }

  // ── Update the displayed message based on selected group ──
  function updateMessage() {
    const shopName = getShopName();
    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    const group = shopGiftMap[selectedGroupIndex];
    const responseEl = document.getElementById("ema-review-response");

    if (!group || !group.first_message) {
      responseEl.textContent = "No review message available for this group.";
      return;
    }

    responseEl.textContent = group.first_message;
  }

  // ── Try to auto-detect and update dropdown + eligibility ──
  function tryAutoDetect() {
    const shopName = getShopName();
    const detailText = getDetailPanelText();
    const autoDetectEl = document.getElementById("ema-auto-detect-status");
    const eligibilityEl = document.getElementById("ema-review-eligibility");
    const selectEl = document.getElementById("ema-group-select");

    if (!detailText) {
      autoDetectEl.innerHTML = `<span class="ema-review-hint">Click an order to auto-detect product</span>`;
      eligibilityEl.innerHTML = "";
      return;
    }

    // Auto-detect product group
    const detectedIndex = autoDetectGroup(shopName, detailText);

    if (detectedIndex >= 0) {
      const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
      const group = shopGiftMap[detectedIndex];
      const prodName = findProductName(shopName, detailText);

      selectEl.value = detectedIndex;
      selectedGroupIndex = detectedIndex;
      updateMessage();

      let detectHtml = `<span class="ema-review-ok">Auto-detected: ${escapeHtml(prodName || group.group.replace(/_/g, " "))}</span>`;
      autoDetectEl.innerHTML = detectHtml;
    } else {
      autoDetectEl.innerHTML = `<span class="ema-review-warn">Could not auto-detect — select manually</span>`;
    }

    // Check eligibility
    const elig = checkEligibility(detailText);
    let eligHtml = "";
    for (const msg of elig.messages) {
      const cls = msg.includes("No prior") ? "ema-review-ok"
        : msg.includes("cancelled") ? "ema-review-warn"
        : "ema-review-warn";
      eligHtml += `<div class="${cls}">${escapeHtml(msg)}</div>`;
    }
    eligibilityEl.innerHTML = eligHtml;
  }

  // ── Find specific product name from detail text ──
  function findProductName(shopName, detailText) {
    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    const lower = detailText.toLowerCase();

    for (const group of shopGiftMap) {
      for (const prod of (group.products || [])) {
        if (lower.includes(prod.toLowerCase().substring(0, 25))) {
          return prod;
        }
      }
    }
    return null;
  }

  // ── Insert text into Etsy's "Message buyer" textarea ──
  function insertIntoMessageBox(text) {
    const textareas = document.querySelectorAll("textarea");
    let targetBox = null;

    for (const ta of textareas) {
      if (ta.id && ta.id.startsWith("ema-")) continue;
      targetBox = ta;
    }

    if (targetBox) {
      // Append our message after the existing purchase URL
      const existingText = targetBox.value;
      const newText = existingText ? existingText + "\n\n" + text : text;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, "value"
      ).set;
      nativeInputValueSetter.call(targetBox, newText);
      targetBox.dispatchEvent(new Event("input", { bubbles: true }));
      targetBox.dispatchEvent(new Event("change", { bubbles: true }));
      targetBox.focus();

      const btn = document.getElementById("ema-review-insert-btn");
      btn.textContent = "Inserted!";
      btn.style.background = "#2e7d32";
      setTimeout(() => {
        btn.textContent = "Insert";
        btn.style.background = "";
      }, 1500);
    } else {
      navigator.clipboard.writeText(text);
      const btn = document.getElementById("ema-review-insert-btn");
      btn.textContent = "Copied! (click Message Buyer first)";
      setTimeout(() => { btn.textContent = "Insert"; }, 2500);
    }
  }

  // ── Make panel draggable ──
  function makeDraggable(el) {
    const header = document.getElementById("ema-review-header");
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

  // ── Auto-click "Message buyer" button only when it's a first message ──
  function autoClickMessageBuyer() {
    const detailText = getDetailPanelText() || "";

    // Don't auto-click if there are existing messages (shows "Reply" or "previous messages")
    if (detailText.includes("previous messages") || detailText.includes("Reply") ||
        detailText.includes("See full conversation")) {
      return false;
    }

    // Only click if "No messages about this order yet" and "Message buyer" button exists
    if (!detailText.includes("No messages about this order yet")) {
      return false;
    }

    const buttons = document.querySelectorAll("button, a");
    for (const btn of buttons) {
      const text = btn.textContent.trim();
      if (text === "Message buyer" || text === "Message Buyer") {
        btn.click();
        return true;
      }
    }
    return false;
  }

  // ── Watch for order detail panel changes ──
  function watchForOrderChanges() {
    let lastReceipt = "";

    const observer = new MutationObserver(() => {
      // Look for Receipt # in the detail panel area specifically
      const detailText = getDetailPanelText();
      if (!detailText) return;

      const receiptMatch = detailText.match(/Receipt\s*#(\d+)/);
      const currentReceipt = receiptMatch ? receiptMatch[1] : "";

      if (currentReceipt && currentReceipt !== lastReceipt) {
        lastReceipt = currentReceipt;
        setTimeout(() => {
          tryAutoDetect();
          // Auto-click "Message buyer" so textarea is ready for Insert
          setTimeout(autoClickMessageBuyer, 500);
        }, 300);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Initialize ──
  function init() {
    setTimeout(() => {
      createPanel();
      watchForOrderChanges();
      tryAutoDetect();
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
