import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const storageRoot = path.resolve(
  process.env.DOCUMENT_STORAGE_ROOT ??
    path.join(process.cwd(), ".data", "documents"),
);

function extension(fileName: string) {
  const value = path.extname(fileName).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(value) ? value : "";
}

function resolveStoragePath(storageKey: string) {
  if (!/^[a-z0-9/_\-.]+$/i.test(storageKey)) {
    throw new Error("مفتاح التخزين غير صالح.");
  }

  const resolved = path.resolve(storageRoot, storageKey);
  if (!resolved.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("مسار التخزين غير صالح.");
  }
  return resolved;
}

export async function storeDocumentFile(
  workspaceId: string,
  file: File,
) {
  const storageKey = `${workspaceId}/${randomUUID()}${extension(file.name)}`;
  const destination = resolveStoragePath(storageKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, new Uint8Array(await file.arrayBuffer()), {
    flag: "wx",
  });
  return storageKey;
}

export async function readDocumentFile(storageKey: string) {
  return readFile(resolveStoragePath(storageKey));
}

export async function removeDocumentFile(storageKey: string) {
  await unlink(resolveStoragePath(storageKey)).catch((error: unknown) => {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  });
}
