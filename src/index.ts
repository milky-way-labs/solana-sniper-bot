import config from "./config";
import {
    BUY_RETRY_DELAY,
    BUY_TIME_CHECK_INTERVAL,
    BUY_MAX_RETRIES,
    SELL_MAX_RETRIES
} from "./constants";
import {log, swap} from "./helpers";

async function waitBuyTime() {
    log(`Waiting ${config.buyTime.toISOString()} before buying...`);

    while (new Date() < config.buyTime) {
        await new Promise(resolve => setTimeout(resolve, BUY_TIME_CHECK_INTERVAL));
    }
}

async function waitSellDelay() {
    log(`Waiting ${config.sellDelay} ms before selling...`);

    await new Promise(resolve => setTimeout(resolve, config.sellDelay));
}

async function buy() {
    log(`Executing buy tx...`);

    for (let i = 0; i < BUY_MAX_RETRIES; i++) {
        const attempts = [];

        for (let j = 0; j < config.buyMaxConcurrentRetries; j++) {
            attempts.push(swap('buy'));
        }

        const results = await Promise.all(attempts);

        for (let j = 0; j < results.length; j++) {
            if (results[j]) {
                log('Buy tx executed successfully.');
                return;
            }
        }

        log(`Buy tx failed, try: ${i + 1}/${BUY_MAX_RETRIES}.`);
        if (i + 1 < SELL_MAX_RETRIES) {
            log(`Retrying...`);
            await new Promise(resolve => setTimeout(resolve, BUY_RETRY_DELAY));
        }
    }

    throw new Error(`Buy tx failed, no retries left.`);
}

async function sell() {
    log('Executing sell tx...');

    for (let i = 0; i < SELL_MAX_RETRIES; i++) {
        try {
            if (await swap('sell')) {
                log('Sell tx executed successfully.');
                return;
            }

            log(`Sell tx failed, try: ${i + 1}/${SELL_MAX_RETRIES}.`);
            if (i + 1 < SELL_MAX_RETRIES) {
                log(`Retrying...`);
            }
        } catch (error) {
            console.error("Unexpected error:", error);

            log(`Sell tx failed, try: ${i + 1}/${SELL_MAX_RETRIES}.`);
            if (i + 1 < SELL_MAX_RETRIES) {
                log(`Retrying...`);
            }
        }
    }

    throw new Error(`Sell tx failed, no retries left.`);
}

async function sniper(): Promise<void> {
    await waitBuyTime();

    await buy();
}

sniper();
