import { socketService } from "../services/socket.service";
import { getExtensionInfo } from "../api/extension.api";
import { triggerCrawl } from "./crawl";

export const setupAgent = () => {
  chrome.storage.local.get(["agentInfo", "wssUrl"], async (result) => {
    const info = result.agentInfo as { id: string; name: string; status: string };

    if (info?.name) {
      try {
        console.log("[Background Agent] Syncing agent info for:", info.name);
        const resp = await getExtensionInfo(info.name);
        const freshInfo = resp?.data || resp;

        // Cập nhật storage ngay lập tức (App sẽ tự sync UI)
        await chrome.storage.local.set({ agentInfo: freshInfo });

        // Nếu đã có wssUrl thì thực hiện kết nối
        const wssUrl = result.wssUrl as string;
        if (wssUrl) {
          console.log("[Background Agent] Initializing socket connection...");
          connect(wssUrl, freshInfo.id, freshInfo.name);
        }
      } catch (error) {
        console.error("[Background Agent] Sync failed during setup:", error);
        updateStorageStatus("DISCONNECTED");
      }
    }
  });
};

export const connect = (wssUrl: string, id: string, name: string) => {
  socketService.connect(wssUrl, { extensionId: id, extensionName: name });

  const socket = socketService.socket;
  if (!socket) return;

  socket.off("connect");
  socket.off("disconnect");
  socket.off("connectionStatus");
  socket.off("action");

  socket.on("connect", async () => {
    console.log("[Background Agent] Socket connected. Syncing info...");
    try {
      const resp = await getExtensionInfo(name);
      const data = resp?.data || resp;
      chrome.storage.local.set({ agentInfo: data });
    } catch (err) {
      console.error("[Background Agent] Sync failed:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("[Background Agent] Socket disconnected.");
    updateStorageStatus("DISCONNECTED");
  });

  socket.on("connectionStatus", (data: { status: string }) => {
    console.log("[Background Agent] Remote status update:", data.status);
    updateStorageStatus(data.status);
  });

  socket.on("action", async (data: { action: string }) => {
    if (data.action === "START_CRAWL") {
      console.log("[Background Agent] Remote START_CRAWL received via Socket.");
      triggerCrawl();
    }
  });
};

export const disconnect = () => {
  socketService.disconnect();
  updateStorageStatus("DISCONNECTED");
};

const updateStorageStatus = async (status: string) => {
  const result = await chrome.storage.local.get(["agentInfo"]);
  if (result.agentInfo) {
    const updated = { ...result.agentInfo, status };
    chrome.storage.local.set({ agentInfo: updated });
  }
};
