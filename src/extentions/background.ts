import { setupAgent, disconnect } from "./agent";
import { crawlConfig } from "../core/config/crawl-config";

const delay = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getNextOccurrence = (timeStr: string) => {
  const [hour, minute] = timeStr.split(":").map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute || 0, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
};

const clearAllTimers = async (tabId: number) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        const id = window.setTimeout(() => { }, 0);
        for (let i = 0; i <= id; i++) {
          window.clearTimeout(i);
          window.clearInterval(i);
          console.log("[Flash Pick] Cleared timer:", i);
        }

        if (document.head) {
          document.head.innerHTML = "";
        }

        console.log("[Flash Pick] All intervals, timeouts and document head cleared.");
      },
    });
  } catch (err) {
    console.error("[Flash Pick] Failed to clear timers:", err);
  }
};

const triggerCrawl = async (tabId?: number) => {
  try {
    let targetTabId = tabId;

    if (!targetTabId) {
      // Tìm tab Shopee nếu không được chỉ định
      const tabs = await chrome.tabs.query({ url: ["https://shopee.vn/*", "https://*.shopee.vn/*"] });
      targetTabId = tabs[0]?.id;

      // Nếu không thấy, tự động mở tab mới
      if (!targetTabId) {
        console.log("[Crawl Trigger] No Shopee tab found, opening new one...");
        const newTab = await chrome.tabs.create({ url: "https://shopee.vn/", active: false });
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

    await delay(5000);
    // clear all interval
    await clearAllTimers(targetTabId);
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


// Đảm bảo chạy ngay khi trình duyệt mở
chrome.runtime.onStartup.addListener(() => {
  console.log("[Background] Browser startup detected. Initializing Agent...");
  setupAgent();
});

// Đảm bảo chạy ngay khi cài đặt hoặc reload extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[Background] Extension installed/reloaded. Setting up scheduled jobs...");
  await chrome.alarms.clearAll();
  // 1. Alarm Keep-alive (1 phút)
  chrome.alarms.create("keep-alive-alarm", { periodInMinutes: 1 });

  // 2. Alarm Cố định hàng ngày
  crawlConfig.schedule.forEach((time) => {
    chrome.alarms.create(`daily-alarm-${time}`, {
      when: getNextOccurrence(time),
      periodInMinutes: 1440,
    });
  });

  setupAgent();
});

// Lắng nghe Alarm để giữ Service Worker không bị sleep quá lâu
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keep-alive-alarm") {
    console.log("[Background] Heartbeat alarm triggered. Ensuring Agent is alive...");
    setupAgent();
  }

  if (alarm.name.startsWith("daily-alarm-")) {
    console.log(`[Scheduled Job] Running daily task for: ${alarm.name} at ${new Date().toLocaleTimeString()}`);
    // Thực hiện tác vụ (ví dụ: tự động crawl)
    triggerCrawl();
  }

});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "RUN_CRAWL" && request.tabId) {
    console.log("[Flash Pick] Manual crawl trigger for tab:", request.tabId);
    triggerCrawl();
    sendResponse({ success: true });
  }

  if (request.action === "CONNECT_SOCKET") {
    console.log("[Flash Pick] App requested socket connection.");
    setupAgent(); // Re-setup using storage
    sendResponse({ success: true });
  }

  if (request.action === "DISCONNECT_SOCKET") {
    console.log("[Flash Pick] App requested socket disconnection.");
    disconnect();
    sendResponse({ success: true });
  }
});