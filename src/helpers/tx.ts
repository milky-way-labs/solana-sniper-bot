import {Connection, LAMPORTS_PER_SOL, VersionedTransaction} from "@solana/web3.js";
import config from "../config";
import fetch from "cross-fetch";
import {
    MAX_BUY_CONCURRENT_TRIES,
    MAX_BUY_RETRIES,
    MAX_SELL_RETRIES,
    MAX_SLIPPAGE,
    USDC_TOKEN_ADDRESS
} from "../constants";

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
    const inputMint = direction === 'buy' ? USDC_TOKEN_ADDRESS : config.tokenAddress;
    const outputMint = direction === 'buy' ? config.tokenAddress : USDC_TOKEN_ADDRESS;
    const amount = config.buyAmount * LAMPORTS_PER_SOL;

    const quoteResponse = await (
        await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}
&outputMint=${outputMint}
&amount=${amount}
&slippageBps=${MAX_SLIPPAGE * 100}`
        )
    ).json();

    console.log(`1@@@@@@@@@@@@@https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}
&outputMint=${outputMint}
&amount=${amount}
&slippageBps=${MAX_SLIPPAGE * 100}`);
    console.log(`2@@@@@@@@@@@@@${JSON.stringify(quoteResponse)}`);

    const {swapTransaction} = await (
        await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // quoteResponse from /quote api
                quoteResponse,
                // user public key to be used for the swap
                userPublicKey: config.wallet.publicKey.toString(),
                // auto wrap and unwrap SOL. default is true
                wrapAndUnwrapSol: true,
                // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
                // feeAccount: "fee_account_public_key"
            })
        })
    ).json();

    console.log(`3@@@@@@@@@@@@@${JSON.stringify(swapTransaction)}`);

    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // sign the transaction
    transaction.sign([config.wallet.payer]);

    // get the latest block hash
    const latestBlockHash = await connection.getLatestBlockhash();

    // Execute the transaction
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2
    });

    console.log(`4@@@@@@@@@@@@@${txid}`);

    const confirmation = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid
    });

    console.log(`5@@@@@@@@@@@@@${JSON.stringify(confirmation)}`);

    return confirmation.value.err === null;
}

export {
    buy,
    sell,
    swap,
};
