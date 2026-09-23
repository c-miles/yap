export const isValidRoomNameFormat = (name: string): boolean => {
  const roomNamePattern = /^[a-z]{3,}-[a-z]{3,}-[a-z]{3,}$/;
  return roomNamePattern.test(name);
};

// also accepts a pasted /room/<name> link
export const normalizeRoomName = (input: string): string => {
  const lowered = input.trim().toLowerCase();
  return (lowered.match(/\/room\/([^/?#]+)/)?.[1] ?? lowered).replace(/\s+/g, "-");
};
