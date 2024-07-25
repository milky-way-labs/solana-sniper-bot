import {
    BlockhashWithExpiryBlockHeight,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from "@solana/web3.js";
import config from "../config";
import axios from "axios";
import {
    MAX_BUY_CONCURRENT_TRIES,
    MAX_BUY_RETRIES,
    MAX_SELL_RETRIES,
    MAX_SLIPPAGE,
    USDC_TOKEN_ADDRESS
} from "../constants";

async function isTransactionConfirmed(connection: Connection, signature: string, latestBlockhash: BlockhashWithExpiryBlockHeight) {
    try {
        const confirmation = await connection.confirmTransaction(
            {
                signature,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                blockhash: latestBlockhash.blockhash,
            },
            'confirmed'
        );

        return confirmation.value.err === null;
    } catch (error) {
        return false;
    }
}

async function buy(connection: Connection) {
    console.log(`Executing buy tx...`);

    for (let i = 0; i < MAX_BUY_RETRIES; i++) {
        const attempts = [];

        for (let j = 0; j < MAX_BUY_CONCURRENT_TRIES; j++) {
            attempts.push(swap(connection, 'buy'));
        }

        const results = await Promise.all(attempts);

        for (let j = 0; j < results.length; j++) {
            if (results[j]) {
                console.log('Buy tx executed successfully.');
                return;
            }
        }

        console.log(`Buy tx failed, try: ${i + 1}/${MAX_BUY_RETRIES}.`);
    }

    console.log(`Buy tx failed, no retries left.`);
    throw new Error();
}

async function sell(connection: Connection) {
    console.log(`Waiting ${config.sellDelay} ms before selling...`);

    await new Promise(resolve => setTimeout(resolve, config.sellDelay));

    console.log('Executing sell tx...');

    for (let i = 0; i < MAX_SELL_RETRIES; i++) {
        try {

            const result = await swap(connection, 'sell');

            if (result) {
                console.log('Sell tx executed successfully.');
                return;
            }

            console.log(`Sell tx failed, try: ${i + 1}/${MAX_SELL_RETRIES}.`);
            if (i + 1 < MAX_SELL_RETRIES) {
                console.log(`Retrying...`);
            }
        } catch (error) {
            console.log(`Sell tx failed, try: ${i + 1}/${MAX_SELL_RETRIES}.`);
            if (i + 1 < MAX_SELL_RETRIES) {
                console.log(`Retrying...`);
            }
        }
    }

    console.log(`Sell tx failed, no retries left.`);
    throw new Error();
}

async function swap(connection: Connection, direction: 'buy' | 'sell') {
    async function fetchSwapRoute(inputMint, outputMint, amount) {
        const response = await axios.get('https://quote-api.jup.ag/v1/quote', {
            params: {
                inputMint,
                outputMint,
                amount,
                slippage: MAX_SLIPPAGE,
            }
        });
        return response.data;
    }

    const inputMint = direction === 'buy' ? USDC_TOKEN_ADDRESS : config.tokenAddress;
    const outputMint = direction === 'buy' ? config.tokenAddress : USDC_TOKEN_ADDRESS;
    const amount = config.buyAmount * LAMPORTS_PER_SOL;

    const {data: {routes}} = await fetchSwapRoute(inputMint, outputMint, amount);

    if (routes && routes.length > 0) {
        const swapRoute = routes[0];

        const latestBlockhash = await this.connection.getLatestBlockhash();

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: config.wallet.publicKey,
                toPubkey: new PublicKey(swapRoute.outAmount),
                lamports: amount,
            })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [config.wallet]);
        return isTransactionConfirmed(connection, signature, latestBlockhash);
    } else {
        return false;
    }
}

export {
    buy,
    sell,
};
