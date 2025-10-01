import {
  SolanaSignMessage,
  SolanaSignMessageFeature,
  SolanaSignMessageInput,
  SolanaSignMessageOutput
} from "@solana/wallet-standard-features";
import { useMutation } from "@tanstack/react-query";
import { getWalletFeature } from "@wallet-standard/react";
import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useWallet } from "./wallet.js";

type RpcConfig = Partial<Omit<SolanaSignMessageInput, "message">>;

interface UseSignMessageReturn {
  data: SolanaSignMessageOutput | undefined;
  error: Error | null;
  isPending: boolean;
  signMessage: () => Promise<SolanaSignMessageOutput>;
}

export function useSignMessage({
  config,
  message,
}: {
  config: RpcConfig;
  message: Uint8Array | string;
}): UseSignMessageReturn {
  const { wallet, account } = useWallet();

  const mutation = useMutation<SolanaSignMessageOutput, Error>({
    mutationFn: async (): Promise<SolanaSignMessageOutput> => {
      if (!wallet) throw new Error("Wallet not connected");

      const feature = getWalletFeature(
        wallet,
        SolanaSignMessage,
      ) as SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;

      if (!feature) {
        throw new Error("Wallet does not support signMessage");
      }

      const signingAccount = config?.account ?? account;
      if (!signingAccount) {
        throw new Error("No wallet account selected");
      }

      const messageBytes = typeof message === "string" ? new TextEncoder().encode(message) : message;

      const input: SolanaSignMessageInput = {
        account: signingAccount,
        message: messageBytes,
      };

      const [result] = await feature.signMessage(input);
      return result;
    },
    mutationKey: [GILL_HOOK_CLIENT_KEY, "signMessage"],
    networkMode: "offlineFirst",
    retry: 3,
    retryDelay: (index) => Math.min(1000 * 2 ** index, 3000),
  });

  return {
    data: mutation.data,
    error: mutation.error,
    isPending: mutation.isPending,
    signMessage: mutation.mutateAsync,
  };
}
