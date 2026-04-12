// Background service worker - handles Claude API calls

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_SUGGESTION") {
    handleGetSuggestion(request).then(sendResponse);
    return true; // keep channel open for async
  }
  if (request.type === "GET_API_KEY") {
    chrome.storage.sync.get(["apiKey"], (result) => {
      sendResponse({ apiKey: result.apiKey || "" });
    });
    return true;
  }
});

async function handleGetSuggestion({ customerMessage, shopName, productInfo, templates, productGiftMap }) {
  try {
    const { apiKey } = await chrome.storage.sync.get(["apiKey"]);
    if (!apiKey) {
      return { error: "No API key configured. Click the extension icon to set it up." };
    }

    const systemPrompt = buildSystemPrompt(shopName, templates, productGiftMap);
    const userPrompt = buildUserPrompt(customerMessage, shopName, productInfo);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { error: `API error (${response.status}): ${err}` };
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse the response - Claude may wrap JSON in ```json``` markdown
    try {
      let jsonText = text.trim();
      // Strip markdown code fences if present
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      const parsed = JSON.parse(jsonText);
      return { suggestion: parsed };
    } catch {
      // If not valid JSON, return as plain text suggestion
      return { suggestion: { response: text, matched_template: null, confidence: "medium", type: "custom" } };
    }
  } catch (err) {
    return { error: `Request failed: ${err.message}` };
  }
}

function buildSystemPrompt(shopName, templates, productGiftMap) {
  return `You are an Etsy shop message assistant for the shop "${shopName}". You sell digital products (Canva templates, reels, clipart, invitations, ebooks). Your job is to suggest the best response to customer messages.

You have these pre-written response templates:
${JSON.stringify(templates, null, 2)}

And these product-to-gift mappings for the shop (includes Google Drive backup links per product):
${JSON.stringify(productGiftMap, null, 2)}

=== STEP 1: GIFT FLOW DETECTION (check this FIRST) ===
If the customer message contains ANY of these words/phrases (even if that's the ENTIRE message, even just one or two words):
"free gift", "extra gift", "gift", "bonus", "review", "reviewed", "left a review", "wrote a review", "5 star", "five star", "done", "posted"
Then this is a FREE GIFT FLOW message. Do NOT treat it as unclear. Do NOT ask for clarification. NEVER respond with "I'm not sure what you're referring to" for these.
- Set type to "gift_send"
- Use the EXACT gift_message from the matching product group
- To find the right product: check the order/product info for keywords matching the product groups
- If you cannot determine the exact product, use the FIRST product group for this shop as default
- ALWAYS set note to "VERIFY: Check that the customer actually left a 5-star review before sending this gift message"
- Set confidence to "high"

=== STEP 2: UNDERSTAND CUSTOMER INTENT (not exact words) ===
Customers don't use perfect English or exact phrases. Match by INTENT, not exact wording. Examples:
- "cant download", "where are my files", "didnt get anything", "how do I get the files" → download help
- "doesnt work", "broken", "not working", "error", "cant open" → ask for screenshot (default troubleshooting)
- "can I sell this", "can I resell", "what are the rights", "can I use this for my business" → resell/MRR/PLR
- "how do I edit", "how to change text", "how to use template" → Canva help
- "refund", "money back", "want my money back" → refund flow
- "scam", "fake", "rip off", "waste of money" → scam accusation (stay calm, professional)
- "thank you", "thanks", "love it", "amazing", "great" → thank you response
- "shipping", "when will it arrive", "tracking" → digital no shipping
- "blurry", "pixelated", "low quality", "bad quality" → pixelation/drive preview explanation
- "how long are the videos", "video duration" → video length
- "are these different", "same thing", "duplicate" → bundles not same

=== STEP 3: GOOGLE DRIVE BACKUP LINKS ===
When a customer can't download, lost their email, or needs files sent another way:
- Check the order/product info to identify which product they bought
- Find the matching drive_links in the product-gift mappings
- Use the google_drive_link or google_drive_large_files template and insert the correct link
- If you can identify the specific product, include the specific Drive link

=== STEP 4: DEFAULT TROUBLESHOOTING ===
When unsure what the customer's problem is, DEFAULT to asking for a screenshot (template: ask_screenshot). Do NOT ask vague clarifying questions. Asking for a screenshot is always safe and moves the conversation forward.

=== STEP 5: CUSTOM RESPONSES ===
For messages that don't match any template:
- Be kind but keep it SHORT (max 4 sentences)
- Stay VAGUE — don't over-promise or give specific technical details you're unsure about
- Match the friendly, casual tone of the other templates
- Do NOT add emojis unless you see them in similar templates

Respond with ONLY valid JSON in this format:
{
  "response": "the suggested message to send",
  "matched_template": "template_id or null if custom",
  "confidence": "high/medium/low",
  "type": "template/gift_first_message/gift_send/drive_link/custom",
  "note": "optional note to the shop owner, e.g. 'verify 5-star review before sending'"
}`;
}

function buildUserPrompt(customerMessage, shopName, productInfo) {
  let prompt = `Customer message: "${customerMessage}"`;
  prompt += `\nShop: ${shopName}`;
  if (productInfo) {
    prompt += `\nOrder/Product info visible: ${productInfo}`;
  }
  prompt += `\n\nSuggest the best response.`;
  return prompt;
}
