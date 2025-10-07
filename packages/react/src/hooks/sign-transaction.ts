"use client";

import { useWalletAccountTransactionSigner } from "@solana/react";
import { getTransactionCodec, Transaction } from "gill";

import { useSolanaClient } from "./client.js";
import { useWallet } from "./wallet.js";

interface UseSignTransactionReturn {
  account: ReturnType<typeof useWallet>["account"];
  signTransaction: (tx: Transaction) => Promise<Uint8Array>;
  signer: ReturnType<typeof useWalletAccountTransactionSigner> | undefined;
}

export function useSignTransaction(): UseSignTransactionReturn {
  const { account } = useWallet();
  const {cluster} = useSolanaClient();

  if(!account) throw new Error("Account is undefined")
  const signer =  useWalletAccountTransactionSigner(account, `solana:${cluster}`);

  async function signTransaction(tx: Transaction): Promise<Uint8Array> {
    if (!account || !signer) throw new Error("Wallet not connected");

    const [signedTx] = await signer.modifyAndSignTransactions([tx]);

    const codec = getTransactionCodec();
    const encodedTx = codec.encode(signedTx);

    return new Uint8Array(encodedTx);
  }

  return { account, signTransaction, signer };
}