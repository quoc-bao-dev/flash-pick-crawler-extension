export const getSession = async () => {
  const res = await fetch(
    "https://shopee.vn/api/v4/flash_sale/get_all_sessions?tracker_info_version=1",
    {
      method: "GET",
      /**
       * Quan trọng:
       * - 'include' sẽ tự đính kèm toàn bộ cookie/same-site token của domain shopee.vn
       * - Bạn KHÔNG cần (và không thể) tự đọc các header bảo mật như x-sap-sec, x-sap-ri...
       *   Trình duyệt + JS của Shopee sẽ lo phần đó.
       */
      credentials: "include",
      headers: {
        // // Các header nhẹ, đủ để giống gần với request gốc nhưng không hard-code key bảo mật
        // accept: "application/json, text/plain, */*",
        // "accept-language": "vi-VN,vi;q=0.9,en;q=0.8",
        // "x-api-source": "pc",
        // "x-requested-with": "XMLHttpRequest",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`getSession failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
};


