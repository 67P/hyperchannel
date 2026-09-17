export default function domainFromId (id) {
  const withoutResource = String(id ?? '').split('/')[0];
  const at = withoutResource.lastIndexOf('@');
  return at >= 0 ? withoutResource.slice(at + 1) : undefined;
}