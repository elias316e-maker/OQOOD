import { getCurrentSession } from "./get-current-session";

export async function getCurrentUser() {
  const session = await getCurrentSession();

  return session?.user ?? null;
}
