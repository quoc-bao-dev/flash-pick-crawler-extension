import axios from "axios";
import { envConfig } from "../config/env-config";

export const httpCrawl = axios.create({
    baseURL: 'https://shopee.vn',
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
});

export const httpWrite = axios.create({
    baseURL: envConfig["ingest-service-url"],
    headers: {
        "content-type": "application/json",
        "x-api-key": envConfig["api-key"],
    },
});

export const httpController = axios.create({
    baseURL: envConfig["controll-service-url"],
    headers: {
        "content-type": "application/json",
        "x-api-key": envConfig["api-key"],
    },
});