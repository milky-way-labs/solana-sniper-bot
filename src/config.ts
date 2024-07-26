import 'dotenv/config';
import {getWallet} from "./helpers";
import {Keypair} from "@solana/web3.js";

interface Config {
    wallet: Keypair;
    tokenAddress: string;
    buyDateTime: Date;
    buyAmount: number;
    buyMaxConcurrentTransactions: number,
    sellDelay: number,
}

function getPrivateKey(): string {
    if (!process.env.PRIVATE_KEY) {
        throw new Error;
    }

    return process.env.PRIVATE_KEY.trim();
}

const config: Config = {
    wallet: getWallet(getPrivateKey()),
    tokenAddress: process.env.TOKEN_ADDRESS as string,
    buyDateTime: new Date(process.env.BUY_DATE_TIME as string),
    buyAmount: Number(process.env.BUY_AMOUNT as string),
    buyMaxConcurrentTransactions: Number(process.env.BUY_MAX_CONCURRENT_RETRIES),
    sellDelay: Number(process.env.SELL_DELAY as string),
};

export default config;