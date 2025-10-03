import {
  SolanaSignMessage,
  SolanaSignMessageFeature,
  SolanaSignMessageInput,
  SolanaSignMessageOutput,
} from "@solana/wallet-standard-features";
import { useMutation } from "@tanstack/react-query";
import { WalletAccount } from "@wallet-standard/core";
import { getWalletFeature } from "@wallet-standard/react";
import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useWallet } from "./wallet.js";

type UseSignMessageConfig = Omit<SolanaSignMessageInput, "account" | "message"> & {
  account?: WalletAccount;
  message: Uint8Array | string;
};

type UseSignMessageInput = {
  config: UseSignMessageConfig;
};

type UseSignMessageOutput = {
  data: SolanaSignMessageOutput | undefined;
  error: Error | null;
  isPending: boolean;
  signMessage: () => Promise<SolanaSignMessageOutput>;
};

export function useSignMessage({ config }: UseSignMessageInput): UseSignMessageOutput {
  const { wallet, account } = useWallet();

  const signingAccount = config?.account ?? account;
  if (!signingAccount) {
    throw new Error("No wallet account selected");
  }

  const messageBytes = typeof config.message === "string" ? new TextEncoder().encode(config.message) : config.message;

  const mutation = useMutation<SolanaSignMessageOutput, Error>({
    mutationFn: async (): Promise<SolanaSignMessageOutput> => {
      if (!wallet) throw new Error("Wallet not connected");

      const feature = getWalletFeature(wallet, SolanaSignMessage) as
        | SolanaSignMessageFeature[typeof SolanaSignMessage]
        | undefined;

      if (!feature) {
        throw new Error("Wallet does not support signMessage");
      }

      const input: SolanaSignMessageInput = {
        account: signingAccount,
        message: messageBytes,
      };

      const [result] = await feature.signMessage(input);
      return result;
    },
    mutationKey: [GILL_HOOK_CLIENT_KEY, "signMessage", signingAccount.address, messageBytes],
  });

  return {
    data: mutation.data as SolanaSignMessageOutput,
    error: mutation.error,
    isPending: mutation.isPending,
    signMessage: mutation.mutateAsync,
  };
}
