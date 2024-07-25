import 'dotenv/config';
import {Keypair} from "@solana/web3.js";
import {getWallet} from "./helpers";

interface Config {
    wallet: Keypair;
    tokenAddress: string;
    buyTime: Date;
    buyAmount: number;
    sellDelay: number,
}

const config: Config = {
    wallet: getWallet(process.env.PRIVATE_KEY.trim()),
    tokenAddress: process.env.TOKEN_ADDRESS as string,
    buyTime: new Date(process.env.BUY_TIME as string),
    buyAmount: process.env.BUY_AMOUNT as number,
    sellDelay: process.env.SELL_DELAY as number,
};

export default config;