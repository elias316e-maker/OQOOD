import { randomBytes } from "node:crypto";

export type WorkspaceIdentity = {
  code: string;
  slug: string;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const SLUG_SUFFIX_LENGTH = 6;

function createRandomToken(
  length: number,
  alphabet = CODE_ALPHABET,
): string {
  const bytes = randomBytes(length);

  return Array.from(bytes, (byte) => {
    return alphabet[byte % alphabet.length];
  }).join("");
}

function normalizeSlugSegment(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);
}

export function generateWorkspaceIdentity(input: {
  workspaceNameAr: string;
  workspaceNameEn?: string;
}): WorkspaceIdentity {
  const code = `WS-${createRandomToken(CODE_LENGTH)}`;

  const normalizedEnglishName = input.workspaceNameEn
    ? normalizeSlugSegment(input.workspaceNameEn)
    : "";

  const slugBase =
    normalizedEnglishName.length >= 2
      ? normalizedEnglishName
      : "workspace";

  const slugSuffix = createRandomToken(
    SLUG_SUFFIX_LENGTH,
  ).toLowerCase();

  return {
    code,
    slug: `${slugBase}-${slugSuffix}`,
  };
}
