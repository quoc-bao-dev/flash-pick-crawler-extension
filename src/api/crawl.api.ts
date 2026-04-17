export const getSession = async () => {
    const res = await fetch(
        "https://shopee.vn/api/v4/flash_sale/get_all_sessions?tracker_info_version=1",
        { method: "GET", credentials: "include" }
    );
    if (!res.ok) throw new Error(`getSession failed: ${res.status} ${res.statusText}`);
    return res.json();
};

export const getAllItemIds = async (promotionId: number | string) => {
    const res = await fetch(
        `https://shopee.vn/api/v4/flash_sale/get_all_itemids?need_personalize=true&promotionid=${promotionId}&sort_soldout=true&tracker_info_version=1`,
        { method: "GET", credentials: "include" }
    );
    if (!res.ok) throw new Error(`getAllItemIds failed: ${res.status} ${res.statusText}`);
    return res.json();
};

export const getItemFlashSale = async ({
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
            'x-requested-with': 'XMLHttpRequest',
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