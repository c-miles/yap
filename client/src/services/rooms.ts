import { authFetch } from "./authFetch";

export interface FoundRoom {
  roomId: string;
  friendlyName: string;
}

export async function findRoom(nameOrId: string): Promise<FoundRoom | null> {
  const response = await authFetch(`/rooms/find-by-name/${encodeURIComponent(nameOrId)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`room lookup failed with ${response.status}`);
  }
  return response.json();
}
