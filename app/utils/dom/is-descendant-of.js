export default function (id, element) {
  if (element.id === id) return true;

  const parentEl = document.getElementById(id);
  return parentEl ? parentEl.contains(element) : false;
}
