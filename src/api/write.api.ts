import { httpWrite } from "../core/http/http";

export const syncSessions = async (sessions: any[]) => {
  const mappedSessions = sessions.map((s: any) => ({
    start_time: s.start_time,
    end_time: s.end_time,
    name: s.name,
    promotionid: s.promotionid,
  }));

  const res = await httpWrite.post("/api/v1/shopee/raw-data/sessions/sync", {
    data: { sessions: mappedSessions },
  });
  return res.data;
};

export const writeBulkData = async (
  promotionId: number | string,
  lsProduct: Array<any>
) => {
  const mappedData = lsProduct.map((product) => ({
    promotionId: String(promotionId),
    productId: String(product.itemid),
    data: product,
    meta: {
      type: "FLASH_SALE_PRODUCT",
      isProcessed: false
    },
  }));

  const res = await httpWrite.post("/api/v1/shopee/raw-data/bulk", {
    data: mappedData,
  });

  return res.data;
};
