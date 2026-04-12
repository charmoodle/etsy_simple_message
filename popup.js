document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const statusEl = document.getElementById("status");

  // Load saved key
  chrome.storage.sync.get(["apiKey"], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });

  saveBtn.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus("Please enter your API key", "error");
      return;
    }
    if (!apiKey.startsWith("sk-ant-")) {
      showStatus("Key should start with sk-ant-...", "error");
      return;
    }
    chrome.storage.sync.set({ apiKey }, () => {
      showStatus("API key saved!", "success");
    });
  });

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = `status ${type}`;
    if (type === "success") {
      setTimeout(() => { statusEl.className = "status"; }, 3000);
    }
  }
});
