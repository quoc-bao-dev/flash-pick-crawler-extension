// Auto inject + run crawler when Shopee tab finishes loading

const main = async (tabId: number) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: async () => {
        console.log("[Flash Pick] Start crawl flash sale...");

        // ======================== API (page context) ===========================
        const getSession = async () => {
          const res = await fetch(
            "https://shopee.vn/api/v4/flash_sale/get_all_sessions?tracker_info_version=1",
            { method: "GET", credentials: "include" }
          );
          if (!res.ok) throw new Error(`getSession failed: ${res.status} ${res.statusText}`);
          return res.json();
        };

        const getAllItemIds = async (promotionId: number | string) => {
          const res = await fetch(
            `https://shopee.vn/api/v4/flash_sale/get_all_itemids?need_personalize=true&promotionid=${promotionId}&sort_soldout=true&tracker_info_version=1`,
            { method: "GET", credentials: "include" }
          );
          if (!res.ok) throw new Error(`getAllItemIds failed: ${res.status} ${res.statusText}`);
          return res.json();
        };

        // Based on the provided curl
        const getItemFlashSale = async ({
          promotionId,
          limit,
          listId,
        }: {
          promotionId: number | string;
          limit: number;
          listId: Array<number | string>;
        }) => {
          const res = await fetch("https://shopee.vn/api/v4/flash_sale/flash_sale_batch_get_items", {
            method: "POST",
            credentials: "include",
            headers: {
                'accept': 'application/json',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                'content-type': 'application/json',
                'origin': 'https://shopee.vn',
                'referer': 'https://shopee.vn/flash_sale?promotionId=225023554564096',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'x-api-source': 'pc',
                // 'x-csrftoken': 'GzZOkrwTHRCnUS1aY3GtnBqQ2Fd4isYB',
                'x-requested-with': 'XMLHttpRequest',
                // 'x-sap-ri': '9a3272695e4b6a054843793a08016744da5a4d37b16393b4af57',
                // 'x-sap-sec': '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',
                'x-shopee-language': 'vi',
                'x-sz-sdk-version': '1.12.27'
            },
            body: JSON.stringify({
              promotionid: Number(promotionId),
              categoryid: 0,
              itemids: listId.map((x) => Number(x)),
              limit,
              with_dp_items: true,
            }),
          });

          if (!res.ok) throw new Error(`getItemFlashSale failed: ${res.status} ${res.statusText}`);
          return res.json();
        };

        // write api
        const writeBulkData = async (
          promotionId: number | string,
          lsProduct: Array<any>
        ) => {
          const mappedData = lsProduct.map((product) => ({
              data: product,
            meta: {
              type: "FLASH_SALE_PRODUCT",
              isProcessed: false,
              context: {
                promotionId
              }
            },
          }));

          const res = await fetch("https://localhost:3000/api/v1/shopee/raw-data/bulk", {
            method: "POST",
            headers: {
              accept: "*/*",
              "accept-language": "en-US,en;q=0.9,vi;q=0.8",
              "content-type": "application/json",
              "x-api-key": "tcv-he-he-he",
              origin: "http://localhost:3000",
              referer: "http://localhost:3000/reference",
            },
            body: JSON.stringify({
              data: mappedData,
            }),
          });

          if (!res.ok) {
            throw new Error(`writeBulkData failed: ${res.status} ${res.statusText}`);
          }

          return res.json();
        };

        // ======================== Main =========================================
        const listPromotionIds: number[] = await getSession().then((data) =>
          (data?.data?.sessions ?? []).map((i: any) => Number(i.promotionid)).filter(Boolean)
        );

        console.log("[Flash Pick] promotionIds:", listPromotionIds);

        for (const promotionId of listPromotionIds) {
          const allItemIdsRes = await getAllItemIds(promotionId);
          const itemIds: number[] =
            (allItemIdsRes?.data?.item_brief_list ?? []).map((i: any) => Number(i.itemid)).filter(Boolean);

          console.log("[Flash Pick] promotionId:", promotionId, "itemIds:", itemIds.length);

          const LIMIT = 16;

          // batch theo LIMIT; batch cuối dùng đúng số lượng còn dư
          for (let start = 0; start < itemIds.length; start += LIMIT) {
            const remaining = itemIds.length - start;
            const limit = Math.min(LIMIT, remaining);
            const batch = itemIds.slice(start, start + limit);

            const result = await getItemFlashSale({ promotionId, limit, listId: batch });

           if(result?.data?.items?.length > 0) {
            await writeBulkData(promotionId, result?.data.items ?? result);
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

        console.log("[Flash Pick] Done.");
      },
    });
  } catch (error) {
    console.error("[Flash Pick] Lỗi khi inject script vào tab:", error);
  }
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("shopee.vn")) {
    main(tabId);
  }
});


