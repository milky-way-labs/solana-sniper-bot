import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import {Wallet} from "@project-serum/anchor";

export function getWallet(wallet: string): Wallet {
    // most likely someone pasted the private key in binary format
    if (wallet.startsWith('[')) {
        const raw = new Uint8Array(JSON.parse(wallet))
        return new Wallet(Keypair.fromSecretKey(raw));
    }

    // most likely someone pasted mnemonic
    if (wallet.split(' ').length > 1) {
        const seed = mnemonicToSeedSync(wallet, '');
        const path = `m/44'/501'/0'/0'`; // we assume it's first path
        return new Wallet(Keypair.fromSeed(derivePath(path, seed.toString('hex')).key));
    }

    // most likely someone pasted base58 encoded private key
    return new Wallet(Keypair.fromSecretKey(bs58.decode(wallet)));
};
