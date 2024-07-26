import config from "./config";
import {BUY_DURATION, BUY_RETRY_DELAY, BUY_TIME_CHECK_INTERVAL, SELL_MAX_RETRIES} from "./constants";
import {log, swap} from "./helpers";

async function waitBuyTime() {
    log(`Waiting ${config.buyDateTime.toISOString()} before buying...`);

    while (new Date() < config.buyDateTime) {
        await new Promise(resolve => setTimeout(resolve, BUY_TIME_CHECK_INTERVAL));
    }
}

async function waitSellDelay() {
    log(`Waiting ${config.sellDelay} ms before selling...`);

    await new Promise(resolve => setTimeout(resolve, config.sellDelay));
}

async function buy() {
    async function execute() {
        const attempts = [];

        if (config.buyMaxConcurrentTransactions > 1) {
            for (let j = 0; j < config.buyMaxConcurrentTransactions; j++) {
                attempts.push(swap('buy'));
            }

            const results = await Promise.all(attempts);

            for (let j = 0; j < results.length; j++) {
                if (results[j]) {
                    log('Buy tx successful.');
                    return;
                }
            }
        } else {
            if (await swap('buy')) {
                log('Buy tx successful.');
                return;
            }
        }

        log(`Buy tx failed`);
    }

    log(`Executing buy tx...`);

    let isFirstTry = true;

    while (new Date().getTime() < config.buyDateTime.getTime() + BUY_DURATION) {
        if (!isFirstTry) {
            log(`Retrying...`);
        }

        try {
            await execute();
        } catch (e) {
            log('Unexpected error: ', e)
        }

        isFirstTry = false;

        await new Promise(resolve => setTimeout(resolve, BUY_RETRY_DELAY));
    }

    throw new Error(`Buy time out.`);
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
