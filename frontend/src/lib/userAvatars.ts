import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const cache = new Map<string, string | null>();

export async function getAvatarByUsername(username: string): Promise<string | undefined> {
  const key = username.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? undefined;

  try {
    const usernameSnap = await getDoc(doc(db, 'usernames', key));
    if (!usernameSnap.exists()) { cache.set(key, null); return undefined; }

    const uid = usernameSnap.data().uid as string;
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) { cache.set(key, null); return undefined; }

    const avatarUrl = (userSnap.data().avatarUrl as string | undefined) ?? null;
    cache.set(key, avatarUrl);
    return avatarUrl ?? undefined;
  } catch {
    return undefined;
  }
}
