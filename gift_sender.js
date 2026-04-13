// Etsy Gift Sender - Content Script
// Helps send free gift messages on shop reviews page

(function () {
  "use strict";

  let panel = null;
  let selectedGroupIndex = 0;

  // ── Detect shop name from URL ──
  function getShopName() {
    const urlMatch = location.pathname.match(/\/shop\/([^/?]+)/);
    if (urlMatch) return urlMatch[1].toLowerCase();

    const shopLinks = document.querySelectorAll('a[href*="/shop/"]');
    for (const link of shopLinks) {
      const m = link.href.match(/\/shop\/([^/?]+)/);
      if (m) return m[1].toLowerCase();
    }
    return "unknown";
  }

  // ── Only show on Reviews tab ──
  function isReviewsTab() {
    // Check if we're on the Reviews tab
    // The Reviews tab is active when clicked, or when URL has certain params
    const tabs = document.querySelectorAll('[role="tab"], a[href*="reviews"], button');
    for (const tab of tabs) {
      const text = tab.textContent.trim();
      if (text.startsWith("Reviews") && (tab.getAttribute("aria-selected") === "true" || tab.classList.contains("active"))) {
        return true;
      }
    }
    // Also check if review content is visible on the page
    const pageText = document.body.innerText;
    if (pageText.includes("Report this review") || pageText.includes("Contact buyer")) {
      return true;
    }
    return false;
  }

  // ── Try to read product info near the currently open conversation ──
  function getReviewProductInfo() {
    // Reviews show product names next to the review
    // Look for product text in the review area
    const allText = document.body.innerText.substring(0, 8000);
    return allText;
  }

  // ── Auto-detect product group from visible review/conversation ──
  function autoDetectGroup(shopName, pageText) {
    if (!pageText) return -1;

    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    const lower = pageText.toLowerCase();

    // Try to find from the conversation panel on the right
    // The conversation shows the order and product info
    const conversationPanel = document.querySelector('[class*="convo"], [class*="message-thread"], [class*="overlay"]');
    const convoText = conversationPanel ? conversationPanel.innerText.toLowerCase() : lower;

    // Check product names in conversation first (more specific)
    for (let i = 0; i < shopGiftMap.length; i++) {
      const group = shopGiftMap[i];
      if (group.is_multiple_items_fallback) continue;

      for (const prod of (group.products || [])) {
        if (convoText.includes(prod.toLowerCase().substring(0, 25))) {
          return i;
        }
      }
    }

    // Keywords in conversation
    for (let i = 0; i < shopGiftMap.length; i++) {
      const group = shopGiftMap[i];
      if (group.is_multiple_items_fallback) continue;

      for (const kw of (group.keywords || [])) {
        if (convoText.includes(kw.toLowerCase())) {
          return i;
        }
      }
    }

    return -1;
  }

  // ── Find specific product name ──
  function findProductName(shopName, pageText) {
    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    const lower = pageText.toLowerCase();

    for (const group of shopGiftMap) {
      for (const prod of (group.products || [])) {
        if (lower.includes(prod.toLowerCase().substring(0, 25))) {
          return prod;
        }
      }
    }
    return null;
  }

  // ── Build dropdown options ──
  function buildDropdownOptions(shopName) {
    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    let html = "";

    for (let i = 0; i < shopGiftMap.length; i++) {
      const group = shopGiftMap[i];
      if (!group.gift_message) continue;

      const giftLabel = group.gift_name ? ` → Send: ${group.gift_name}` : "";
      const groupLabel = group.group.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

      html += `<option value="${i}">${groupLabel}${giftLabel}</option>`;
    }

    return html;
  }

  // ── Create the floating panel ──
  function createPanel() {
    if (panel) return;
    if (!isReviewsTab()) return;

    const shopName = getShopName();
    const dropdownOptions = buildDropdownOptions(shopName);

    if (!dropdownOptions) return; // No gift messages for this shop

    panel = document.createElement("div");
    panel.id = "ema-gift-panel";
    panel.innerHTML = `
      <div id="ema-gift-header">
        <span>3. Gift Sender <span class="ema-shop-badge">${shopName}</span></span>
        <span class="ema-toggle">▼</span>
      </div>
      <div id="ema-gift-body">
        <div id="ema-gift-reminder">Sort reviews by "Most recent" first</div>
        <div id="ema-gift-selector">
          <label for="ema-gift-select">Product Group:</label>
          <select id="ema-gift-select">
            ${dropdownOptions}
          </select>
          <div id="ema-gift-detect-status"></div>
        </div>
        <div id="ema-gift-result">
          <div id="ema-gift-response"></div>
          <div id="ema-gift-actions">
            <button id="ema-gift-insert-btn" title="Insert into message box">Insert</button>
            <button id="ema-gift-copy-btn" title="Copy to clipboard">Copy</button>
            <button id="ema-gift-edit-btn" title="Edit before inserting">Edit</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Toggle collapse
    document.getElementById("ema-gift-header").addEventListener("click", (e) => {
      if (e.target.classList.contains("ema-toggle") || e.target === document.getElementById("ema-gift-header")) {
        panel.classList.toggle("ema-collapsed");
      }
    });

    // Dropdown change
    document.getElementById("ema-gift-select").addEventListener("change", (e) => {
      selectedGroupIndex = parseInt(e.target.value);
      updateMessage();
    });

    // Insert button
    document.getElementById("ema-gift-insert-btn").addEventListener("click", () => {
      const text = document.getElementById("ema-gift-response").textContent;
      insertIntoMessageBox(text);
    });

    // Copy button
    document.getElementById("ema-gift-copy-btn").addEventListener("click", () => {
      const text = document.getElementById("ema-gift-response").textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("ema-gift-copy-btn");
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      });
    });

    // Edit button
    document.getElementById("ema-gift-edit-btn").addEventListener("click", () => {
      const responseEl = document.getElementById("ema-gift-response");
      const editBtn = document.getElementById("ema-gift-edit-btn");
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

    // Show initial message
    updateMessage();
  }

  // ── Update displayed gift message ──
  function updateMessage() {
    const shopName = getShopName();
    const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
    const group = shopGiftMap[selectedGroupIndex];
    const responseEl = document.getElementById("ema-gift-response");

    if (!group || !group.gift_message) {
      responseEl.textContent = "No gift message available for this group.";
      return;
    }

    responseEl.textContent = group.gift_message;
  }

  // ── Try auto-detect when conversation opens ──
  function tryAutoDetect() {
    const shopName = getShopName();
    const pageText = getReviewProductInfo();
    const detectEl = document.getElementById("ema-gift-detect-status");
    const selectEl = document.getElementById("ema-gift-select");

    if (!detectEl) return;

    const detectedIndex = autoDetectGroup(shopName, pageText);

    if (detectedIndex >= 0) {
      const shopGiftMap = PRODUCT_GIFT_MAP[shopName] || [];
      const group = shopGiftMap[detectedIndex];
      const prodName = findProductName(shopName, pageText);

      selectEl.value = detectedIndex;
      selectedGroupIndex = detectedIndex;
      updateMessage();

      detectEl.innerHTML = `<span class="ema-gift-ok">Auto-detected: ${escapeHtml(prodName || group.group.replace(/_/g, " "))}</span>`;
    } else {
      detectEl.innerHTML = `<span class="ema-gift-hint">Select product group manually</span>`;
    }
  }

  // ── Insert text into message box ──
  function insertIntoMessageBox(text) {
    // Find the "Write a message" textarea on the conversation panel
    const textareas = document.querySelectorAll('textarea, [contenteditable="true"]');
    let targetBox = null;

    for (const el of textareas) {
      if (el.id && el.id.startsWith("ema-")) continue;
      // Look for the message input
      const placeholder = el.getAttribute("placeholder") || "";
      if (placeholder.toLowerCase().includes("message") || placeholder.toLowerCase().includes("write")) {
        targetBox = el;
        break;
      }
      targetBox = el; // fallback to any textarea
    }

    if (targetBox && targetBox.tagName === "TEXTAREA") {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, "value"
      ).set;
      nativeInputValueSetter.call(targetBox, text);
      targetBox.dispatchEvent(new Event("input", { bubbles: true }));
      targetBox.dispatchEvent(new Event("change", { bubbles: true }));
      targetBox.focus();

      const btn = document.getElementById("ema-gift-insert-btn");
      btn.textContent = "Inserted!";
      btn.style.background = "#6a1b9a";
      setTimeout(() => {
        btn.textContent = "Insert";
        btn.style.background = "";
      }, 1500);
    } else {
      navigator.clipboard.writeText(text);
      const btn = document.getElementById("ema-gift-insert-btn");
      btn.textContent = "Copied! (click Contact Buyer first)";
      setTimeout(() => { btn.textContent = "Insert"; }, 2500);
    }
  }

  // ── Make panel draggable ──
  function makeDraggable(el) {
    const header = document.getElementById("ema-gift-header");
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

  // ── Watch for conversation panel changes ──
  function watchForConversationChanges() {
    let lastConvoText = "";

    const observer = new MutationObserver(() => {
      // Detect when "Contact buyer" opens a conversation
      const pageText = document.body.innerText;
      if (!pageText.includes("Write a message") && !pageText.includes("Contact buyer")) return;

      // Check if conversation content changed (different buyer clicked)
      const orderMatch = pageText.match(/Order\s*#(\d+)/);
      const currentOrder = orderMatch ? orderMatch[1] : "";

      if (currentOrder && currentOrder !== lastConvoText) {
        lastConvoText = currentOrder;
        setTimeout(tryAutoDetect, 500);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Watch for Reviews tab activation ──
  function watchForReviewsTab() {
    const observer = new MutationObserver(() => {
      if (isReviewsTab() && !panel) {
        createPanel();
        watchForConversationChanges();
        tryAutoDetect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Initialize ──
  function init() {
    setTimeout(() => {
      if (isReviewsTab()) {
        createPanel();
        watchForConversationChanges();
        tryAutoDetect();
      } else {
        // Wait for user to click Reviews tab
        watchForReviewsTab();
      }
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
