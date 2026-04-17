import { getAllItemIds, getSession, getItemFlashSale } from "../api/crawl.api";
import { syncSessions, writeBulkData } from "../api/write.api";

const startCrawl = async () => {
  console.log("[Flash Pick] Start crawl flash sale...");

  // ======================== Main =========================================
  const sessionRes = await getSession();
  const sessions = sessionRes?.data?.sessions ?? [];

  console.log("[Flash Pick] Sync sessions...", sessions.length);
  try {
    await syncSessions(sessions);
  } catch (error) {
    console.error("[Flash Pick] syncSessions failed", error);
  }

  const listPromotionIds: number[] = sessions.map((i: any) => Number(i.promotionid)).filter(Boolean);

  console.log("[Flash Pick] promotionIds:", listPromotionIds);

  let totalFound = 0;
  let totalCrawled = 0;
  let totalSynced = 0;

  for (const promotionId of listPromotionIds) {
    const allItemIdsRes = await getAllItemIds(promotionId);
    const itemIds: number[] =
      (allItemIdsRes?.data?.item_brief_list ?? []).map((i: any) => Number(i.itemid)).filter(Boolean);

    totalFound += itemIds.length;
    console.log("[Flash Pick] promotionId:", promotionId, "itemIds:", itemIds.length);

    const LIMIT = 16;

    // batch theo LIMIT; batch cuối dùng đúng số lượng còn dư
    for (let start = 0; start < itemIds.length; start += LIMIT) {
      const remaining = itemIds.length - start;
      const limit = Math.min(LIMIT, remaining);
      const batch = itemIds.slice(start, start + limit);

      const result = await getItemFlashSale({ promotionId, limit, listId: batch });
      const crawledItems = result?.data?.items ?? [];
      totalCrawled += crawledItems.length;

      if (crawledItems.length > 0) {
        console.log("[Flash Pick] batch result", crawledItems);

        try {
          const bulkRes = await writeBulkData(promotionId, crawledItems);
          totalSynced += (bulkRes?.count || 0);
        } catch (error) {
          console.error("[Flash Pick] writeBulkData failed", error);
        }
      } else {
        console.log("[Flash Pick] batch result is empty");
      }

      console.log("[Flash Pick] batch result", {
        promotionId,
        batchIndex: Math.floor(start / LIMIT),
        limit,
        data: result?.data ?? result,
      });

    }
  }

  console.log(
    `[Flash Pick] Done. Summary: Found ${totalFound} items, Crawled ${totalCrawled} items, Successfully Synced ${totalSynced} items.`
  );
  try {
    chrome.runtime.sendMessage({ action: "CRAWL_DONE" });
  } catch (err) {}
};

startCrawl();
