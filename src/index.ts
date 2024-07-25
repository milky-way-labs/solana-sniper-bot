import config from "./config";
import {buy, sell} from "./helpers";
import {Connection} from "@solana/web3.js";

let purchaseSuccess: boolean = false;

async function waitBuyTime() {
    console.log(`Waiting ${config.buyTime.toLocaleString()} before buying...`);

    while (new Date() < config.buyTime) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function sniper(): Promise<void> {
    await waitBuyTime();

    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    await buy(connection);

    await sell(connection);
}

sniper();
