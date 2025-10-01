import { useMutation } from "@tanstack/react-query";
import { GillUseRpcHook } from "./types.js";
import { useWallet } from "./wallet.js";
import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import {
  SolanaSignMessage,
  SolanaSignMessageFeature,
  SolanaSignMessageInput,
  SolanaSignMessageOutput,
} from "@solana/wallet-standard-features";

// Define the configuration type for the RPC method
type RpcConfig = SolanaSignMessageInput;

type UseSignMessageInput<TConfig extends RpcConfig = RpcConfig> = GillUseRpcHook<TConfig> & {
  /*
   * The message to sign.
   */
  message: Uint8Array | string;
};

// Define the response type for the hook
type UseSignMessageResponse = SolanaSignMessageOutput;

/*
 * Hook for signing a message using the connected wallet.
 *
 */
export function useSignMessage<TConfig extends RpcConfig = RpcConfig>({
  config,
  message,
}: UseSignMessageInput<TConfig>) {
  const { wallet } = useWallet();

  const { data, ...rest } = useMutation<SolanaSignMessageOutput, Error>({
    mutationFn: async (): Promise<SolanaSignMessageOutput> => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      const feature = (wallet.features as unknown as Record<string, unknown>)?.[SolanaSignMessage] as
        | SolanaSignMessageFeature[typeof SolanaSignMessage]
        | undefined;

      if (!feature || typeof feature.signMessage !== "function") {
        throw new Error("Wallet does not support signMessage");
      }

      const messageBytes = typeof message === "string" ? new TextEncoder().encode(message) : message;

      const input: SolanaSignMessageInput = {
        ...(config || {}),
        account:
          config?.account ??
          (() => {
            throw new Error("Account is required in config");
          })(),
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
    ...rest,
    message: data as UseSignMessageResponse,
  };
}
