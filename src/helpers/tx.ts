import config from "../config";
import {MAX_SLIPPAGE, USDC_TOKEN_ADDRESS} from "../constants";
import {SolanaTracker} from "solana-swap";
import {log} from "./log";

async function swap(direction: 'buy' | 'sell') {
    const solanaTracker = new SolanaTracker(
        config.wallet,
        "https://rpc.solanatracker.io/public?advancedTx=true"
    );

    const swapResponse = await solanaTracker.getSwapInstructions(
        direction === 'buy' ? USDC_TOKEN_ADDRESS : config.tokenAddress,
        direction === 'buy' ? config.tokenAddress : USDC_TOKEN_ADDRESS,
        config.buyAmount,
        MAX_SLIPPAGE,
        config.wallet.publicKey.toBase58(), // Payer public key
        0.0005, // Priority fee (Recommended while network is congested)
    );

    try {
        log('Performing swap...');

        const txid = await solanaTracker.performSwap(swapResponse, {
            sendOptions: {skipPreflight: true},
            confirmationRetries: 30,
            confirmationRetryTimeout: 500,
            lastValidBlockHeightBuffer: 150,
            resendInterval: 1000,
            confirmationCheckInterval: 1000,
            commitment: "processed",
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

export {
    swap,
};
