import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useRef } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

/**
 * Returns an upload function that takes a File and returns { hash, sizeBytes }.
 * Uses StorageClient under the hood.
 */
export function useStorageUpload() {
  const { identity } = useInternetIdentity();
  const clientRef = useRef<StorageClient | null>(null);

  const getClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const config = await loadConfig();
    const agent = new HttpAgent({
      identity: identity ?? undefined,
      host: config.backend_host,
    });
    if (config.backend_host?.includes("localhost")) {
      await agent.fetchRootKey().catch(console.error);
    }
    const client = new StorageClient(
      config.bucket_name,
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
    clientRef.current = client;
    return client;
  }, [identity]);

  const uploadFile = useCallback(
    async (
      file: File,
      onProgress?: (pct: number) => void,
    ): Promise<{ hash: string; sizeBytes: bigint }> => {
      const client = await getClient();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await client.putFile(bytes, onProgress);
      return { hash, sizeBytes: BigInt(file.size) };
    },
    [getClient],
  );

  return { uploadFile };
}
