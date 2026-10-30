import { authClient } from "@/lib/auth/client";
import {
  buildExportFile,
  createDek,
  deriveAesKey,
  encryptJson,
  parsePack,
  randomBytes,
  readExportFile,
  b64,
  unb64,
  unwrapDek,
  wrapDek,
  sealAccount,
} from "@/lib/vault/crypto";
import { DEMO_ACCOUNTS } from "@/lib/vault/demo";
import { rememberBearer } from "@/lib/vault/memory";
import { KDF_ITERATIONS_V2, authSecret, recoveryVerifier } from "@/lib/vault/secrets";
import { normalizeRecoveryCode, generateRecoveryCode } from "@/lib/vault/recovery";
import type { AccountFields } from "@/lib/vault/types";
import {
  finishRecovery,
  insertItems,
  openRecovery,
  saveMeta,
  updatePasswordWrap,
  type VaultMeta,
} from "@/lib/vault/api";

type Result<T> = { data: T | null; error: { message?: string } | null };

type EmailClient = {
  signUp: {
    email: (input: { email: string; password: string; name: string }) => Promise<
      Result<{ token: string | null; user: { id: string; email: string } }>
    >;
  };
  signIn: {
    email: (input: { email: string; password: string }) => Promise<
      Result<{ token: string | null; user: { id: string; email: string } }>
    >;
  };
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  }) => Promise<Result<unknown>>;
  getSession: () => Promise<Result<{ user?: { id: string } }>>;
};

function emails(): EmailClient {
  return authClient as unknown as EmailClient;
}

export function errorText(error: unknown): string {
  if (!(error instanceof Error)) return "Une erreur est survenue.";
  const message = error.message.trim();
  if (!message || message.length > 280) return "Une erreur est survenue.";
  return message;
}

export function mapAuthError(message: string | undefined): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("exist") || text.includes("already")) {
    return "Un coffre existe déjà pour cette adresse.";
  }
  if (text.includes("origin")) return "Connexion refusée. Rechargez la page et réessayez.";
  if (text.includes("short") || (text.includes("password") && text.includes("8"))) {
    return "Mot de passe trop court. 10 caractères minimum.";
  }
  if (text.includes("invalid email")) return "Adresse e-mail invalide.";
  if (text.includes("invalid") || text.includes("password") || text.includes("credential")) {
    return "E-mail ou mot de passe incorrect.";
  }
  return "Impossible de continuer. Réessayez.";
}

async function establishSession(token: string | null | undefined): Promise<void> {
  rememberBearer(token);
  const session = await emails().getSession();
  if (session.error || !session.data?.user) throw new Error("La session n'a pas pu être ouverte.");
}

export async function signUpEmail(email: string, password: string): Promise<{ id: string }> {
  const name = email.split("@")[0]?.slice(0, 40) || "Coffre";
  const secret = await authSecret(email, password);
  const result = await emails().signUp.email({ email, password: secret, name });
  if (result.error || !result.data?.user) throw new Error(mapAuthError(result.error?.message));
  await establishSession(result.data.token);
  return result.data.user;
}

export async function signInWithMaster(email: string, password: string): Promise<{ id: string }> {
  const secret = await authSecret(email, password);
  try {
    return await signInEmail(email, secret);
  } catch (first) {
    try {
      const legacy = await signInEmail(email, password);
      await changeLoginPassword(password, secret);
      return legacy;
    } catch {
      throw first;
    }
  }
}

export async function signInEmail(email: string, password: string): Promise<{ id: string }> {
  const result = await emails().signIn.email({ email, password });
  if (result.error || !result.data?.user) throw new Error(mapAuthError(result.error?.message));
  await establishSession(result.data.token);
  return result.data.user;
}

export async function changeLoginPassword(currentPassword: string, newPassword: string): Promise<void> {
  const result = await emails().changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });
  if (result.error) throw new Error(mapAuthError(result.error.message));
}

const keyUsages: KeyUsage[] = ["encrypt", "decrypt"];

export async function createVault(password: string): Promise<{
  dek: CryptoKey;
  recoveryCode: string;
  demoIds: string[];
}> {
  const recoveryCode = generateRecoveryCode();
  const dek = await createDek();
  const kdfSalt = randomBytes(16);
  const recoverySalt = randomBytes(16);
  const passKek = await deriveAesKey(password, kdfSalt, KDF_ITERATIONS_V2, keyUsages);
  const recKek = await deriveAesKey(
    normalizeRecoveryCode(recoveryCode),
    recoverySalt,
    KDF_ITERATIONS_V2,
    keyUsages,
  );
  const dekPassword = await wrapDek(dek, passKek);
  const dekRecovery = await wrapDek(dek, recKek);
  const hint = await encryptJson(dek, { code: recoveryCode });
  await saveMeta({
    data: {
      kdfSalt: b64(kdfSalt),
      dekPassword: JSON.stringify(dekPassword),
      recoverySalt: b64(recoverySalt),
      dekRecovery: JSON.stringify(dekRecovery),
      recoveryVerifier: await recoveryVerifier(recoveryCode),
      recoveryHint: JSON.stringify(hint),
      kdfIters: KDF_ITERATIONS_V2,
    },
  });
  const items = [];
  for (const account of DEMO_ACCOUNTS) {
    const sealed = await sealAccount(dek, account);
    items.push({ ...sealed, hasPassword: account.password.trim().length > 0 });
  }
  await insertItems({ data: { items } });
  return { dek, recoveryCode, demoIds: items.map((item) => item.id) };
}

export async function unlockVault(password: string, meta: VaultMeta): Promise<CryptoKey> {
  try {
    const kek = await deriveAesKey(password, unb64(meta.kdfSalt), meta.kdfIters, keyUsages);
    return await unwrapDek(parsePack(meta.dekPassword), kek);
  } catch {
    throw new Error("Mot de passe incorrect.");
  }
}

export async function rewrapWithPassword(
  dek: CryptoKey,
  password: string,
): Promise<{ dekPassword: string; kdfSalt: string; kdfIters: number }> {
  const salt = randomBytes(16);
  const kek = await deriveAesKey(password, salt, KDF_ITERATIONS_V2, keyUsages);
  return {
    dekPassword: JSON.stringify(await wrapDek(dek, kek)),
    kdfSalt: b64(salt),
    kdfIters: KDF_ITERATIONS_V2,
  };
}

export async function resetWithRecovery(
  email: string,
  recoveryCode: string,
  newPassword: string,
): Promise<void> {
  const verifier = await recoveryVerifier(recoveryCode);
  let proof = verifier;
  let opened: Awaited<ReturnType<typeof openRecovery>>;
  try {
    opened = await openRecovery({ data: { email, recoveryProof: verifier } });
  } catch {
    proof = normalizeRecoveryCode(recoveryCode);
    opened = await openRecovery({ data: { email, recoveryProof: proof } });
  }
  let dek: CryptoKey;
  try {
    const kek = await deriveAesKey(
      normalizeRecoveryCode(recoveryCode),
      unb64(opened.recoverySalt),
      opened.recoveryIters,
      keyUsages,
    );
    dek = await unwrapDek(parsePack(opened.dekRecovery), kek);
  } catch {
    throw new Error("Ce code ne permet pas de déchiffrer le coffre.");
  }
  const wrapped = await rewrapWithPassword(dek, newPassword);
  const nextAuth = await authSecret(email, newPassword);
  await finishRecovery({
    data: {
      email,
      recoveryProof: proof,
      nextVerifier: verifier,
      newPassword: nextAuth,
      dekPassword: wrapped.dekPassword,
      kdfSalt: wrapped.kdfSalt,
      kdfIters: wrapped.kdfIters,
    },
  });
}

export async function savePasswordWrap(wrapped: {
  dekPassword: string;
  kdfSalt: string;
  kdfIters: number;
}): Promise<void> {
  await updatePasswordWrap({ data: wrapped });
}

export async function exportVault(accounts: AccountFields[], passphrase: string): Promise<string> {
  return buildExportFile(accounts, passphrase);
}

export async function importVault(fileText: string, passphrase: string): Promise<AccountFields[]> {
  return readExportFile(fileText, passphrase);
}
