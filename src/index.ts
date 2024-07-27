import config from "./config";
import {BUY_RETRY_DELAY, BUY_TIME_CHECK_INTERVAL} from "./consts";
import {log, swap} from "./helpers";
import {SwapFailedError} from "./errors";

async function waitBuyTime() {
    log(`Waiting ${config.buyDateTime.toISOString()} before buying...`);

    while (new Date() < config.buyDateTime) {
        await new Promise(resolve => setTimeout(resolve, BUY_TIME_CHECK_INTERVAL));
    }
}

async function buy() {
    async function execute() {
        if (config.buyMaxConcurrentTransactions > 1) {
            const attempts = [];

            for (let j = 0; j < config.buyMaxConcurrentTransactions; j++) {
                attempts.push(swap('buy', config.buyAmount));
            }

            const results = await Promise.all(attempts);

            for (let j = 0; j < results.length; j++) {
                if (results[j]) {
                    return;
                }
            }
        } else if (await swap('buy', config.buyAmount)) {
            return;
        }

        throw new SwapFailedError();
    }

    log(`Executing buy...`);

    let isFirstTry = true;
    const buyStartDateTime = (new Date());

    while ((new Date()).getTime() < buyStartDateTime.getTime() + config.buyTimeout) {
        if (!isFirstTry) {
            log(`Retrying...`);
        }

        try {
            await execute();

            log('Buy successful.');

            return;
        } catch (e) {
            if (e instanceof SwapFailedError) {
                log(`Buy failed`);
            } else {
                log('Unexpected error: ', e)
            }
        }

        isFirstTry = false;

        await new Promise(resolve => setTimeout(resolve, BUY_RETRY_DELAY));
    }

    throw new Error(`Buy time out.`);
}

async function sniper(): Promise<void> {
    await waitBuyTime();

    await buy();
}

sniper();
