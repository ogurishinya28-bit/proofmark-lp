/// <reference lib="webworker" />

type HashRequest = { id: string; file: File };
type HashResponse = { id: string; sha256: string; size: number; name: string; type: string };

self.onmessage = async (event: MessageEvent<HashRequest>) => {
  const { id, file } = event.data;
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const sha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

  const payload: HashResponse = {
    id,
    sha256,
    size: file.size,
    name: file.name,
    type: file.type,
  };

  self.postMessage(payload);
};

export {};