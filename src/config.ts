import 'dotenv/config';
import {getWallet} from "./helpers";
import {Wallet} from "@project-serum/anchor";

interface Config {
    wallet: Wallet;
    tokenAddress: string;
    buyTime: Date;
    buyAmount: number;
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
    buyTime: new Date(process.env.BUY_TIME as string),
    buyAmount: Number(process.env.BUY_AMOUNT as string),
    sellDelay: Number(process.env.SELL_DELAY as string),
};

export default config;