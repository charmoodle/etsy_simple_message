// All response templates organized by category
// and product-to-gift mappings per shop

const RESPONSE_TEMPLATES = [
  // === REVIEW & FREE GIFT FLOW ===
  {
    id: "review_not_posted_yet",
    category: "review",
    description: "Customer says they left review but it's not showing",
    template: `Hi! I'm not seeing the review come through yet. Could you please double-check that it was submitted? Once it's confirmed, I'll send your free gift right away. Thanks so much!`
  },
  {
    id: "review_reminder",
    category: "review",
    description: "Remind customer about leaving a review for free gift",
    template: `Hi! Hope you're doing well. Just let me know once the review is up, and I'll send over your free gift right away.`
  },
  {
    id: "review_how_to",
    category: "review",
    description: "Customer doesn't know how to leave a review or left it in messages",
    template: `Hi! To leave a review, go to your Etsy account → Purchases & Reviews → find your order → Leave a Review. You can also follow the instructions from this link:\nhttps://help.etsy.com/hc/en-us/articles/115013197687-How-to-Leave-a-Review-on-Etsy?segment=shopping\nOnce it's posted, let me know and I'll send your gift right away!`
  },
  {
    id: "review_this_is_messages",
    category: "review",
    description: "Customer left their review in the message section instead of the review section",
    template: `Hi! Thank you for your kind words. This is the message section. To leave a review please go to your Etsy account → Purchases & Reviews → your order → Leave a Review. Once it's posted, let me know and I'll send your gift right away :)`
  },
  {
    id: "review_cant_leave",
    category: "review",
    description: "Customer says they can't leave a review",
    template: `Hi! Sometimes Etsy won't open the review window until the item is downloaded or the order fully updates. Since you've downloaded it now, can you check again to see if it lets you leave a review? If it still shows the same message, let me know.`
  },
  {
    id: "review_low_stars",
    category: "review",
    description: "Customer left a review with less than 5 stars but positive comment",
    template: `Hi {name}! Thank you for your order and the kind comment. I just wanted to double check because you mentioned the product was good, but the review shows {stars} stars. Sometimes that can happen by accident, especially on mobile, and it can really impact a small shop. If it wasn't intentional, would you mind updating it to five stars? I'd really appreciate it.`
  },
  {
    id: "review_gift_after_review",
    category: "review",
    description: "Customer asks for free gift before leaving review",
    template: `Hi! Thanks for reaching out. The extra gift is sent after the 5-star review, as mentioned in the note. To leave a review, just go to your Etsy account → Purchases & Reviews → find your order → tap Leave a Review. Once it's posted, let me know and I'll send your gift right away!`
  },
  {
    id: "ask_for_review_generic",
    category: "review",
    description: "Generic ask for review after purchase - no specific product gift",
    template: `You're very welcome! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases`
  },

  // === DOWNLOAD & FILE ISSUES ===
  {
    id: "how_to_download",
    category: "download",
    description: "Customer doesn't know how to download their digital item",
    template: `Hi! Thank you for your order. Here are the instructions on how to download your digital item:\n\nhttps://help.etsy.com/hc/en-us/articles/115013328108-How-to-Download-a-Digital-Item?segment=shopping\n\nIf it still doesn't work, please let me know and I'll help you get the files another way :)`
  },
  {
    id: "download_successful",
    category: "download",
    description: "Confirming download was successful",
    template: `Hi! Thank you for your order. It looks like your download was successful. Please feel free to reach out if you have any questions :)`
  },
  {
    id: "zip_file_help",
    category: "download",
    description: "Customer can't open ZIP files",
    template: `Hi! The files are in ZIP format and just need to be unzipped. If you're seeing an error, feel free to send a screenshot so I can help you more accurately.`
  },
  {
    id: "google_drive_link",
    category: "download",
    description: "Send Google Drive download link to customer",
    template: `Hi! Thanks for reaching out. I've set up a Google Drive link for your purchase so you can download easily.\n\n{link}\n\nPlease feel free to let me know if you have any other questions :)`
  },
  {
    id: "google_drive_large_files",
    category: "download",
    description: "Large files via Google Drive - desktop recommended",
    template: `Hi! Thank you for your purchase. I've set up a Google Drive link for your order so you can download the pdf with links to the files. The files are large, so it may not be possible to download them on a phone — a desktop works best.\n\n{link}\n\nPlease feel free to let me know if you have any other questions :)`
  },
  {
    id: "digital_no_shipping",
    category: "download",
    description: "Customer confused about shipping for digital product",
    template: `Hi! Thank you so much for your order!\nThese are digital download files, so no physical item will be shipped. I'm not sure why Etsy marked it with shipping, but you can access everything directly through your downloads or the links I can provide.\n\nIf you have any trouble accessing the files, just let me know and I'll help right away.`
  },

  // === CANVA HELP ===
  {
    id: "canva_how_to_edit",
    category: "canva",
    description: "Customer doesn't know how to edit Canva template",
    template: `Hi! Thanks for reaching out. After you click the link in the PDF, choose 'Use template' to open it in your free Canva account. From there, you can just click on the text to edit it.`
  },
  {
    id: "canva_beginner_guide",
    category: "canva",
    description: "Customer needs general Canva help",
    template: `Hi! Here's a quick Canva guide that walks you through how to open and edit the template: https://www.canva.com/learn/how-to-canva-beginners-guide/\nHope it helps :)`
  },
  {
    id: "canva_share_template_link",
    category: "canva",
    description: "Customer asks how to share/add Canva template links",
    template: `Hi! Thank you for reaching out! Here's Canva's guide on how to add and share template links: https://www.canva.com/help/share-template-link/\n\nThis should help you add the links into your download. Let me know if you need anything else!`
  },
  {
    id: "canva_link_template_button",
    category: "canva",
    description: "Customer doesn't see where to click to open Canva template",
    template: `Hi! Thanks for reaching out. Just click the "Link Template" button to open the Canva invite template. Let me know if you still need help.`
  },
  {
    id: "canva_pro_elements_fix",
    category: "canva",
    description: "Customer has issues with Canva pro elements",
    template: `Hi! Thank you for reaching out. I'm sorry for the inconvenience. I've updated a version without pro elements so you can download with no problems with a free Canva account.`
  },
  {
    id: "not_all_canva",
    category: "canva",
    description: "Customer thinks all files are Canva but some aren't",
    template: `Hi! Thanks for reaching out. Most of the templates work with Canva, but other items like fonts and vectors are not related to Canva.`
  },

  // === RESELL RIGHTS (MRR/PLR) ===
  {
    id: "can_resell_yes",
    category: "resell",
    description: "Customer asks if they can resell the product",
    template: `Hi! Yes, you can edit the template and resell it. Your customers can also rebrand it inside Canva for their own business. If you need anything else, just let me know.`
  },
  {
    id: "resell_rights_terms",
    category: "resell",
    description: "Customer asks about resell rights terms",
    template: `Hi! Thanks for reaching out. The resell rights terms and conditions are in the downloaded pdf.`
  },
  {
    id: "mrr_plr_confirm",
    category: "resell",
    description: "Customer confirms MRR/PLR rights",
    template: `Hi! Thank you for reaching out. Yes the products include MRR and PLR so you can resell.`
  },
  {
    id: "mrr_plr_detailed",
    category: "resell",
    description: "Customer asks detailed question about MRR/PLR and what they can do, can they resell on other platforms",
    template: `Hi! Thanks for reaching out!\n\nYes, absolutely. This is an MRR (Master Resale Rights) product, so you are welcome to resell the entire bundle as a package on any platform of your choice.\n\nPlease keep in mind that while you have the rights to resell the content, you must use your own listing images and descriptions, as well as your own Google Drive links for fulfillment.\n\nLet me know if you have any other questions!`
  },
  {
    id: "can_customize_resell",
    category: "resell",
    description: "Customer asks if they can customize and rebrand",
    template: `Hi! Yes you can rebrand and resell as your own since it includes MRR and PLR :)`
  },
  {
    id: "own_listing_photos",
    category: "resell",
    description: "Customer wants to use seller's listing photos to resell",
    template: `Hi! Thanks so much for reaching out. Just a quick note that you'll need to create your own listing photos and descriptions when reselling. The ones I use include my logo, so they can't be reused, and the resell rights apply to the content itself only. Hope that helps clarify.`
  },
  {
    id: "pricing_resell",
    category: "resell",
    description: "Customer asks about pricing for resale",
    template: `Hi! Yes, you may customize and rebrand the product for resale under the included PLR/MRR license. Pricing is your choice, provided it complies with the license terms included with the product.`
  },

  // === TROUBLESHOOTING ===
  {
    id: "ask_screenshot",
    category: "troubleshooting",
    description: "Need screenshot to diagnose issue",
    template: `Hi! Thank you for reaching out. Can you please share a screenshot of your issue so I can better assist you? Thank you!`
  },
  {
    id: "ask_which_link",
    category: "troubleshooting",
    description: "Customer reports broken link but need to know which one",
    template: `Hi! Thanks for reaching out. Could you let me know which link you clicked that led to the error so I can help you resolve it? Thank you.`
  },
  {
    id: "ask_which_files",
    category: "troubleshooting",
    description: "Customer says files aren't working but need specifics",
    template: `Hi! Thanks for reaching out. Can you let me know which files are not working so I can better assist you?`
  },
  {
    id: "ask_clarify",
    category: "troubleshooting",
    description: "Customer message is unclear, need clarification",
    template: `Hi! Thanks for reaching out. Could you clarify what you're looking for? I want to make sure I understand before I help.`
  },
  {
    id: "permission_error",
    category: "troubleshooting",
    description: "Customer gets permission error on a link",
    template: `Hi! Thanks for reaching out. Could you let me know which link you clicked that brought you to the permission error so I can help you resolve it? Thank you.`
  },
  {
    id: "which_product_files",
    category: "troubleshooting",
    description: "Customer has issues but seller has many products",
    template: `Hi! Thanks for reaching out. I have quite a few digital products, so to help me troubleshoot this properly, could you let me know which link you clicked before you were taken to that page? That will help me backtrack and assist you faster. Thank you!`
  },
  {
    id: "svg_looks_small",
    category: "troubleshooting",
    description: "Customer says SVG looks small or low quality",
    template: `Hi! The SVG may look small in Google Drive because it's a vector file and the preview uses the canvas size, not the final scale. Once opened or downloaded, it can be resized without losing quality. For a quick preview, please check the PNG version.`
  },
  {
    id: "pixelation_drive_preview",
    category: "troubleshooting",
    description: "Customer says images look pixelated",
    template: `Hi! Thank you for your feedback. The pixelation you're seeing is from the Google Drive preview. Once downloaded, the PNG and SVG files are high-resolution (300 DPI). I'm happy to help if you have any questions.`
  },
  {
    id: "read_instructions",
    category: "troubleshooting",
    description: "Customer didn't read instructions and is confused",
    template: `Hi! Please read the instructions and description carefully — the link I sent is correct. Let me know if you need help accessing it.`
  },
  {
    id: "try_opening_again",
    category: "troubleshooting",
    description: "Customer can't open a link - ask to try again",
    template: `Hi! Could you try opening it again? The link should take you to Canva.`
  },

  // === PAYMENT & REFUND ===
  {
    id: "refund_processed",
    category: "payment",
    description: "Refund has been processed",
    template: `Hi! I've gone ahead and processed your refund.`
  },
  {
    id: "payment_failed",
    category: "payment",
    description: "Customer's payment didn't go through",
    template: `Hi! Thanks for reaching out. It looks like the order was canceled due to a payment issue. If you're still interested, you're welcome to place the order again. Since it's a digital item, it will be delivered instantly after successful purchase.`
  },
  {
    id: "payment_issue_etsy",
    category: "payment",
    description: "Customer has payment issues - Etsy handles payments",
    template: `Thank you for reaching out. Payments are handled by Etsy, not me. Sometimes payments fail, but you can try again or contact Etsy Support through the Help section if it keeps happening.`
  },
  {
    id: "minimum_order",
    category: "payment",
    description: "Customer mentions minimum order value issue",
    template: `Hi! There isn't a minimum order value. Please try placing the order again. If the message still appears, you may need to contact the platform's support team for assistance.`
  },
  {
    id: "duplicate_order_refund",
    category: "payment",
    description: "Customer placed duplicate order",
    template: `Hi! Thank you for your order. I have refunded you for one of the orders and it also looks like you have successfully downloaded the file. Please feel free to reach out if you have any further questions.`
  },
  {
    id: "refund_sorry",
    category: "payment",
    description: "Refund with apology for issue",
    template: `Hi! I'm sorry you had trouble with this. Thank you for letting me know — I'll look into fixing it, and I've gone ahead and refunded you.`
  },

  // === NEGATIVE REVIEW RESPONSE ===
  {
    id: "negative_review_fix_offer",
    category: "review_damage",
    description: "Customer left bad review but issue is fixable",
    template: `Hi! I'm sorry you had trouble. I do wish you'd given me a little time to respond before leaving a review, as I would have been happy to fix the issue. If you're open to it, please send me screenshots of the problem and I can send you replacements right away. Thank you.`
  },
  {
    id: "negative_review_update_request",
    category: "review_damage",
    description: "Sent fix to customer, asking them to update review",
    template: `Hi! Thanks for letting me know, and I'm sorry this happened. I hope this helps and I would be very grateful if you could update your review as a negative review can really hurt my small shop.`
  },
  {
    id: "review_inaccurate_link_in_file",
    category: "review_damage",
    description: "Customer left bad review saying link is missing but it's in the file",
    template: `Hi there, I'm sorry you missed it, but the link is actually in your file. I've attached a screenshot to help you find it.\nOnce you've accessed the template, I hope you'll consider updating your review since the current one is inaccurate. Thank you!`
  },
  {
    id: "scam_accusation",
    category: "review_damage",
    description: "Customer accuses product of being a scam",
    template: `Hi there,\nI'm sorry to hear you're disappointed with your purchase. I assure you this is a legitimate product, and I'd like to understand exactly what went wrong.\nCould you please provide more details on why you feel the product is not as described? Once I have more information, I can better assist you with your concerns.`
  },

  // === PRODUCT SPECIFIC ===
  {
    id: "faceless_reels_explain",
    category: "product",
    description: "Customer asks what faceless reels are",
    template: `Hi! Thanks for your order. The item you purchased is the faceless reels bundle. These are ready-to-post reels you can use on your social media to help you grow your followers. Hope that clears it up.`
  },
  {
    id: "video_quality",
    category: "product",
    description: "Customer complains about video quality",
    template: `Hi there,\nI'm sorry to hear some of the videos aren't coming through clearly. To get the best quality, please try these steps:\n- Check Settings: Click the gear icon in the video player and manually select the highest resolution (e.g., 1080p).\n- Connection: Ensure you have a stable internet connection, as playback quality often drops automatically to prevent buffering.\n- Download: If available, download the files directly to your device to view them without streaming compression.\nIf the quality still isn't right, please let me know which specific videos are affected so I can look into it!`
  },
  {
    id: "video_length",
    category: "product",
    description: "Customer asks about video lengths",
    template: `Hi! Thanks for reaching out. Most of the videos range from about 5 to 20 seconds, though a few may be slightly shorter or longer.`
  },
  {
    id: "reels_how_to_resell",
    category: "product",
    description: "Customer asks how to resell reels/templates",
    template: `Hi! Thank you for your order.\n\nMost of the reels are provided through Canva or Google Drive.\nFor Canva files, you'll need to create your own Canva template link to resell.\nFor Google Drive files, please make a copy to your own Drive and share your own link.\n\nHope this helps!`
  },
  {
    id: "bundles_not_same",
    category: "product",
    description: "Customer asks if different sized bundles are the same",
    template: `Hi! Thanks for reaching out. The different packs are different files, not the same content with different covers. There may be some overlap, but they are not identical. If you want the most complete option and to avoid overlap, I recommend the largest pack.`
  },
  {
    id: "no_custom_edits",
    category: "product",
    description: "Customer asks for custom character edits on invitation",
    template: `Hi! Thanks for reaching out. For now, I don't offer edits to change or add specific characters on the invitation.`
  },
  {
    id: "invitation_print_size",
    category: "product",
    description: "Customer asks about printing invitations at correct size",
    template: `Hi! You don't need a business account for that. Just download the invitation from Canva as a PDF, then open the 2-per-page template and paste the invitation into it. That template is already set up so each one prints at 5x7 on a standard sheet. After that, just download or print from the template and it should come out correctly.`
  },

  // === TEXT EDITABLE ===
  {
    id: "text_editable_canva",
    category: "canva",
    description: "Customer asks if text can be changed, edited, translated, or customized in the template",
    template: `Hi! Thanks for reaching out. Yes, all the text is fully editable in Canva. You can change it to any language or wording you'd like. Just click on the text to edit it. Let me know if you need any help!`
  },

  // === HOW TO USE ===
  {
    id: "how_to_use_instagram",
    category: "product",
    description: "Customer asks how to use the product on Instagram or social media, or for MRR",
    template: `Hi! Thanks for reaching out! To use these for MRR, you can resell the entire bundle as your own digital product to keep 100% of the profits. For your own account, simply upload the videos to Instagram or TikTok to drive engagement and attract potential buyers!`
  },

  // === GENERAL ===
  {
    id: "thank_you_response",
    category: "general",
    description: "Customer says something nice or thanks you",
    template: `That's amazing to hear! Thank you so much for the support :)`
  },
  {
    id: "etsy_encouragement",
    category: "general",
    description: "Customer struggling with their Etsy shop",
    template: `Hi! Etsy can be tough in the beginning, especially with how competitive digital products are. Everyone's results are different, and it really does take a lot of time and hard work to get things going. Don't get discouraged — I'm wishing you the best with your shop!`
  },
  {
    id: "ask_clarify_horizontal",
    category: "general",
    description: "Customer asks about horizontal version or unclear product variant",
    template: `Hi! Thanks for reaching out. Could you clarify what you're referring to? A bit more detail will help me assist you.`
  },
  {
    id: "click_link_in_screenshot",
    category: "general",
    description: "Customer doesn't see the link in their files",
    template: `Hi, please click the link shown in the screenshot to access your files. Thank you.`
  }
];

// Product-to-gift mappings per shop
const PRODUCT_GIFT_MAP = {
  charmoodle: [
    {
      group: "small_bundles",
      products: [
        "10+ Million Digital Products Bundle",
        "85 Million Digital Products Bundle",
        "25+ Million Digital Products Bundle",
        "6000+ Faceless Videos Reel Templates Bundle",
        "8000+ Faceless Reels Bundle",
        "6000+ Faceless Videos Reels Templates Bundle",
        "1300+ Motherhood Reels"
      ],
      keywords: ["million digital", "faceless video", "faceless reel", "motherhood reel"],
      drive_links: {
        "10+ Million Digital Products Bundle": "https://drive.google.com/file/d/1wx9vxCz2APPvKCOznXOr4a9gPUg31dab/view?usp=drive_link",
        "6000+ Faceless Videos Reel Templates Bundle": "https://drive.google.com/drive/folders/1jRyG59q1ZWzaC6IAIx1R9o-QHTZbfsw7?usp=drive_link",
        "85 Million Digital Products Bundle": "https://drive.google.com/drive/folders/1-SBAFjd0AZx-he_Lm17I4yM-SDVY4oWC?usp=drive_link",
        "8000+ Faceless Reels Bundle": "https://drive.google.com/file/d/1bxgatWuGi-7X9DTNQMRN7QRQulqo4fFA/view?usp=drive_link",
        "6000+ Faceless Videos Reels Templates Bundle": "https://drive.google.com/file/d/1ISI9wnay9eBi2jeY9A0kIV-etS4zgJTH/view?usp=sharing",
        "25+ Million Digital Products Bundle": "https://drive.google.com/file/d/1vYho16T0NY3AgYip76YWHWAt95NUtapk/view?usp=sharing",
        "1300+ Motherhood Reels": "https://drive.google.com/file/d/1aUl4VRW71HZuLzRqEwjG3FDvK8IMGJ7A/view?usp=sharing"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you a FREE "500 Digital Products to Sell Ebook" as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review!\n\nHere is the link to download a FREE "500 Digital Products to Sell Ebook" as a token of appreciation:\n\nhttps://digitalwealthsacademy.com/free?tab=ebook\n\nHave a wonderful day 🍓`,
      gift_name: "500 Digital Products to Sell Ebook"
    },
    {
      group: "carousel_products",
      products: [
        "400+ Faceless Instagram Carousel Templates",
        "Instagram Carousels Templates Bundle",
        "100+ Pink Instagram Carousel Templates"
      ],
      keywords: ["carousel template", "pink instagram", "faceless instagram carousel"],
      drive_links: {
        "400+ Faceless Instagram Carousel Templates": "https://drive.google.com/file/d/1zOaZm_B4P3N9kpzCmQGoli-5Ln7bXgZu/view?usp=sharing",
        "Instagram Carousels Templates Bundle": "https://drive.google.com/file/d/1-aw003BJCcbI0jI0cUS46ItUuHb7i4Or/view?usp=sharing",
        "100+ Pink Instagram Carousel Templates": "https://drive.google.com/file/d/1qFb3lXTRyTGnS8Duh2t0LrVQDlqmFcQk/view?usp=sharing"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you the bonus FREE "500 Carousel Stickers" as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review!\n\nHere is the link to download the FREE "500 Carousel Stickers" as a token of appreciation:\n\nhttps://digitalwealthsacademy.com/free?tab=stickers\n\nHave a wonderful day 🍓`,
      gift_name: "500 Carousel Stickers"
    },
    {
      group: "carousel_stickers",
      products: [
        "Instagram Trending Carousel Stickers"
      ],
      keywords: ["carousel sticker", "trending carousel", "viral digital marketing canva pack"],
      drive_links: {
        "Instagram Trending Carousel Stickers": "https://drive.google.com/file/d/1u50Wr2269DQSWncHOZE6IX0H9N7pFnxj/view?usp=sharing"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you a FREE "100 Reels Templates" as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review! Here is the canva link to your FREE 100 Reels Templates:\n\nhttps://www.canva.com/design/DAGBIPPnQmI/WasjBWbH0o_36lL3KYqr6g/view?utm_content=DAGBIPPnQmI&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview\n\nHave a wonderful day 🍓`,
      gift_name: "100 Reels Templates"
    },
    {
      group: "big_bundles",
      products: [
        "Faceless Digital Marketing Bundle MRR Products",
        "Digital Marketing Course Bundle with PLR & MRR",
        "Digital Marketing Bundle | Resell Vault",
        "Passive Income eBook Bundle",
        "Faceless Digital Marketing Bundle | Resell Vault"
      ],
      keywords: ["marketing bundle", "marketing course", "resell vault", "passive income ebook", "mini mrr"],
      drive_links: {
        "Faceless Digital Marketing Bundle MRR Products": "https://drive.google.com/file/d/1TRJtfe5FbYVvGCnrzzlk5JPUrfltPfT0/view?usp=sharing",
        "Digital Marketing Course Bundle with PLR & MRR": "https://drive.google.com/file/d/1BCZQs5L0Dl9ofpKS2_rEhyWmz3yn0Lln/view?usp=sharing",
        "Digital Marketing Bundle | Resell Vault": "https://drive.google.com/file/d/1keFdnQfFAiPN-TlwkA7ruifwbhFFr92e/view?usp=sharing",
        "Passive Income eBook Bundle": "https://drive.google.com/file/d/1iHQnJ4_lXnlNqJti1kvlsOiGMqE5TtiV/view?usp=sharing",
        "Faceless Digital Marketing Bundle | Resell Vault": "https://drive.google.com/file/d/11c3UR_ojWQlmBMYRqPfzqDeSfhI4VPsO/view?usp=sharing"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you a FREE "UGC Playbook" editable in Canva as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review! Here is the canva link to your FREE UGC Playbook:\n\nhttps://canva.link/obl5xnzf2btav5d\n\nHave a wonderful day 🍓`,
      gift_name: "UGC Playbook"
    },
    {
      group: "multiple_items",
      products: [],
      keywords: [],
      first_message: `Hi there! Thank you so much for your orders and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave 5-star reviews here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you a FREE "UGC Playbook" editable in Canva as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review! Here is the canva link to your FREE UGC Playbook:\n\nhttps://canva.link/obl5xnzf2btav5d\n\nHave a wonderful day 🍓`,
      gift_name: "UGC Playbook",
      is_multiple_items_fallback: true
    }
  ],
  pearpebbears: [
    {
      group: "bridal_products",
      products: [
        "Bridesmaid Proposal Newspaper",
        "Pink Red Bridal Shower Games",
        "Bridesmaid Proposal Card Template"
      ],
      keywords: ["bridesmaid", "bridal", "maid of honor", "groomsman"],
      drive_links: {
        "Bridesmaid Proposal Newspaper": "https://drive.google.com/file/d/1-vz-3_qpZGxDY-VZ1pv2PRp8ATyF0xp6/view?usp=sharing",
        "Pink Red Bridal Shower Games": "https://drive.google.com/file/d/1b0lLXV0TgRwaXz3nzBrl3IxG8rMBc9HY/view?usp=sharing",
        "Bridesmaid Proposal Card Template": "https://drive.google.com/file/d/1dKap3GgkUqOXBSEKoVt_xaCki8wEEqG6/view?usp=sharing"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you a FREE "Wedding Newspaper Template" as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review! Here is the link to your Wedding Newspaper Template:\n\nhttps://drive.google.com/file/d/1VOdY6jPAEsjBdn-1Q6KgJBG3g0tUyWlR/view?usp=sharing\n\nHave a wonderful day 🐻`,
      gift_name: "Wedding Newspaper Template"
    },
    {
      group: "winnie_pooh",
      products: [
        "Winnie the Pooh PNG Clipart Bundle"
      ],
      keywords: ["winnie", "pooh", "classic friends"],
      drive_links: {
        "Winnie the Pooh PNG Clipart Bundle": "https://drive.google.com/drive/folders/1wnPhfumxIGZoSYk6VxslxXB7Jr2R-dVv?usp=sharing"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you a FREE bonus pack of Holiday Theme Classic Pooh PNG files as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review! Here is the link to your Holiday Theme Classic Pooh PNG files:\n\nhttps://drive.google.com/drive/folders/17B07yOWtcJUxKCkoS9UV5cbSMUPZD-vA?usp=sharing\n\nHave a wonderful day 🐻`,
      gift_name: "Holiday Theme Classic Pooh PNG files"
    },
    {
      group: "snoopy",
      products: [
        "350+ Cute Snoopy SVG PNG Bundle",
        "Christmas Snoopy PNG Bundle"
      ],
      keywords: ["snoopy", "charlie brown", "comic dog"],
      drive_links: {
        "350+ Cute Snoopy SVG PNG Bundle": "https://drive.google.com/drive/folders/1LG-5qJNuXjvpY5uIz2KbYXL9s6Q6DRaf?usp=sharing",
        "Christmas Snoopy PNG Bundle": "https://drive.google.com/drive/folders/1ShAMcWZ5wws11ke7bNqHxNOgBTh7wioq?usp=drive_link"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you a bonus pack of FREE "120 Snoopy PNG and SVG files" as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review! Here is the link to your 120 Bonus Snoopy PNG and SVG files:\n\nhttps://drive.google.com/drive/folders/1UR3TWHOTVAm2Sg4GC3ySJVCfA0b8Jkfe?usp=sharing\n\nHave a wonderful day 🐻`,
      gift_name: "120 Snoopy PNG and SVG files"
    },
    {
      group: "princess",
      products: [
        "Princess Birthday Invitation Card",
        "Princess Birthday Invitation Card V2"
      ],
      keywords: ["princess", "royal theme", "party invite"],
      drive_links: {
        "Princess Birthday Invitation Card": "https://drive.google.com/file/d/1zqW6a7GRY2DiINhxl5DXDoQGBrJ0Is0u/view?usp=sharing",
        "Princess Birthday Invitation Card V2": "https://drive.google.com/file/d/1-6fbZav5ML73ZQ9j3hS4JxCeSSEfuVTI/view?usp=sharing"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases\n\nAs a thank-you, I'll send you a FREE "Princess Bingo Card Game" as a token of appreciation!`,
      gift_message: `Thank you so much for taking the time to write a review! Here is the link to your Princess Bingo Card Game:\n\nhttps://drive.google.com/drive/folders/19yLwDjXy0KExh2RCAFT2KrlqGeHkvKm-?usp=sharing\n\nHave a wonderful day 🐻`,
      gift_name: "Princess Bingo Card Game"
    },
    {
      group: "wedding_newspaper",
      products: [
        "Wedding Newspaper Template"
      ],
      keywords: ["wedding newspaper", "newlywed times", "wedding program", "itinerary"],
      drive_links: {
        "Wedding Newspaper Template": "https://drive.google.com/file/d/1VOdY6jPAEsjBdn-1Q6KgJBG3g0tUyWlR/view?usp=sharing"
      },
      first_message: `Hi there! Thank you so much for your order and for trusting my shop! If you enjoyed your purchase, I'd be so grateful if you could leave a 5-star review here — it really helps my shop grow!\n\nwww.etsy.com/your/purchases`,
      gift_message: null,
      gift_name: null
    }
  ]
};
