import config from "../config";
import {MAX_SLIPPAGE, SOL_TOKEN_ADDRESS} from "../consts";
import {SolanaTracker} from "solana-swap";
import {log} from "./log";

async function swap(direction: 'buy' | 'sell', amount: number | string): Promise<boolean> {
    const solanaTracker = new SolanaTracker(
        config.wallet,
        "https://rpc.solanatracker.io/public?advancedTx=true"
    );

    const swapResponse = await solanaTracker.getSwapInstructions(
        direction === 'buy' ? SOL_TOKEN_ADDRESS : config.tokenAddress,
        direction === 'buy' ? config.tokenAddress : SOL_TOKEN_ADDRESS,
        amount,
        MAX_SLIPPAGE,
        config.wallet.publicKey.toBase58(),
        0.005, // Priority fee (Recommended while network is congested)
    );

    log('Performing swap...');

    try {
        const txid = await solanaTracker.performSwap(swapResponse, {
            sendOptions: {skipPreflight: true},
            confirmationRetries: 30,
            confirmationRetryTimeout: 500,
            lastValidBlockHeightBuffer: 150,
            resendInterval: 1000,
            confirmationCheckInterval: 1000,
            commitment: "finalized",
            skipConfirmationCheck: false // Set to true if you want to skip confirmation checks and return txid immediately
        });

        log('Swap successful.');

        return true;
    } catch (error: any) {
        const {signature, message} = error;
        console.error("Error performing swap:", message, signature);
        return false;
    }
}

async function checkOpen(): Promise<boolean> {
    log('Checking if pool is open...');

    try {
        const response = await fetch(`https://public-api.birdeye.so/defi/price?address=${config.tokenAddress}`, {
            headers: {
                "X-API-KEY": config.birdeyeApiKey,
            },
        });

        if (response.ok) {
            const jsonResponse = await response.json();

            if (jsonResponse.data) {
                log('Pool is open.');
                return true;
            } else {
                log('Pool is closed.');
                return false;
            }
        } else {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Failed to fetch data with status code ${response.status}`);
        }
    } catch (error: any) {
        const {message} = error;
        log("Error checking if pool is open:", message);
        return false;
    }
}

export {
    swap,
    checkOpen,
};
