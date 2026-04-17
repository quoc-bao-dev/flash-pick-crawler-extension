export const triggerCrawl = async (tabId?: number) => {
  try {
    let targetTabId = tabId;

    if (!targetTabId) {
      // Tìm tab Shopee nếu không được chỉ định
      const tabs = await chrome.tabs.query({ url: ["https://shopee.vn/*", "https://*.shopee.vn/*"] });
      targetTabId = tabs[0]?.id;

      // Nếu không thấy, tự động mở tab mới
      if (!targetTabId) {
        console.log("[Crawl Trigger] No Shopee tab found, opening new one...");
        const newTab = await chrome.tabs.create({ url: "https://shopee.vn/" });
        targetTabId = newTab.id;

        // Đợi tab load xong mới inject
        await new Promise<void>((resolve) => {
          const listener = (tabId: number, info: any) => {
            if (tabId === targetTabId && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
      }
    }

    if (!targetTabId) {
      console.error("[Crawl Trigger] No valid Shopee tab found for crawling");
      return;
    }

    console.log("[Crawl Trigger] Injecting crawler.js into tab:", targetTabId);
    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      world: "MAIN",
      files: ["crawler.js"],
    });

  } catch (error) {
    console.error("[Crawl Trigger] Error during crawl trigger:", error);
  }
};
