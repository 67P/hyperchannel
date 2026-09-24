/**
 * Returns the channel at `relativePosition` from `currentChannel` within
 * `channels`, wrapping around at the edges. Used for keyboard navigation.
 *
 * @param {Array} channels
 * @param {*} currentChannel
 * @param {number} relativePosition -1 for previous, 1 for next
 * @returns {*}
 */
export default function relativeChannel (channels, currentChannel, relativePosition) {
  const currentPosition = channels.indexOf(currentChannel);
  let edge = channels.length - 1;
  let edgeOpposite = 0;

  if (relativePosition === -1) {
    [edge, edgeOpposite] = [edgeOpposite, edge];
  }

  const newPosition = currentPosition === edge ? edgeOpposite : currentPosition + relativePosition;
  return channels[newPosition];
}
