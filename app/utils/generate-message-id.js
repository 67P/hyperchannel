export default function generateMessageId () {
  return 'hc-' + Math.random().toString(30).substr(2, 9)
}
