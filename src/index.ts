import config from "./config";
import {BUY_TIME_CHECK_INTERVAL, MAX_BUY_CONCURRENT_TRIES, MAX_BUY_RETRIES, MAX_SELL_RETRIES} from "./constants";
import {swap} from "./helpers";

async function waitBuyTime() {
    console.log(`Waiting ${config.buyTime.toLocaleString()} before buying...`);

    while (new Date() < config.buyTime) {
        await new Promise(resolve => setTimeout(resolve, BUY_TIME_CHECK_INTERVAL));
    }
}

async function waitSellDelay() {
    console.log(`Waiting ${config.sellDelay} ms before selling...`);

    await new Promise(resolve => setTimeout(resolve, config.sellDelay));
}

async function buy() {
    console.log(`Executing buy tx...`);

    for (let i = 0; i < MAX_BUY_RETRIES; i++) {
        const attempts = [];

        for (let j = 0; j < MAX_BUY_CONCURRENT_TRIES; j++) {
            attempts.push(swap('buy'));
        }

        const results = await Promise.all(attempts);

        for (let j = 0; j < results.length; j++) {
            if (results[j]) {
                console.log('Buy tx executed successfully.');
                return;
            }
        }

        console.log(`Buy tx failed, try: ${i + 1}/${MAX_BUY_RETRIES}.`);
        if (i + 1 < MAX_SELL_RETRIES) {
            console.log(`Retrying...`);
        }
    }

    throw new Error(`Buy tx failed, no retries left.`);
}

async function sell() {
    console.log('Executing sell tx...');

    for (let i = 0; i < MAX_SELL_RETRIES; i++) {
        try {
            if (await swap('sell')) {
                console.log('Sell tx executed successfully.');
                return;
            }

            console.log(`Sell tx failed, try: ${i + 1}/${MAX_SELL_RETRIES}.`);
            if (i + 1 < MAX_SELL_RETRIES) {
                console.log(`Retrying...`);
            }
        } catch (error) {
            console.error("Unexpected error:", error);

            console.log(`Sell tx failed, try: ${i + 1}/${MAX_SELL_RETRIES}.`);
            if (i + 1 < MAX_SELL_RETRIES) {
                console.log(`Retrying...`);
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
