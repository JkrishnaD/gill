"use client";

import { useWalletAccountTransactionSigner } from "@solana/react";
import { Base64EncodedWireTransaction, getTransactionCodec, Signature, Transaction } from "gill";

import { useSolanaClient } from "./client.js";
import { useWallet } from "./wallet.js";

interface UseSignAndSendTransactionReturn {
  account: ReturnType<typeof useWallet>["account"];
  signAndSendTransaction: (tx: Transaction) => Promise<Signature>;
  signer: ReturnType<typeof useWalletAccountTransactionSigner> | undefined;
}

export function useSignAndSendTransaction(): UseSignAndSendTransactionReturn {
  const { account } = useWallet();
  const {cluster, rpc} = useSolanaClient();

  if(!account) throw new Error("Account is undefined")
  const signer = useWalletAccountTransactionSigner(account, `solana:${cluster}`);

  async function signAndSendTransaction(tx: Transaction): Promise<Signature> {
    if (!account || !signer) throw new Error("Wallet not connected");

    const [signedTx] = await signer.modifyAndSignTransactions([tx]);

    const codec = getTransactionCodec();
    const encodedTx = codec.encode(signedTx);

    const bytes = new Uint8Array(encodedTx);
    const signedTxBase64  = Buffer.from(bytes).toString('base64') as Base64EncodedWireTransaction;
    
    const response = await rpc
        .sendTransaction(signedTxBase64, {
          encoding: 'base64',
          preflightCommitment: 'confirmed',
          skipPreflight: false,
        })
        .send();
        
    return response;
  }

  return { account, signAndSendTransaction, signer };
}