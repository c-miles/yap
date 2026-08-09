// Exactly one side of each pair is "polite" (yields on offer collisions).
// Both ends derive it from the same userId comparison, so no coordination needed.
export function isPolite(myId: string, theirId: string): boolean {
  return myId < theirId;
}

// Only the impolite peer ignores a colliding offer. A remote answer mid-apply
// isn't a collision — that negotiation is about to finish.
export function shouldIgnoreOffer(
  polite: boolean,
  makingOffer: boolean,
  signalingState: RTCSignalingState,
  isSettingRemoteAnswerPending: boolean
): boolean {
  const readyForOffer =
    !makingOffer && (signalingState === "stable" || isSettingRemoteAnswerPending);
  return !polite && !readyForOffer;
}
