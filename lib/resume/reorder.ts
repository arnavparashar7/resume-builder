/**
 * Moves the item with the given id one slot up or down within `arr` (mutates
 * in place - intended for use inside an immer `produce` callback), then
 * reassigns every item's `order` field to match its new index so the
 * persisted order always matches array position.
 */
export function moveAndReorder<T extends { id: string; order: number }>(
  arr: T[],
  id: string,
  direction: "up" | "down"
): void {
  const index = arr.findIndex((item) => item.id === id);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= arr.length) return;

  const tmp = arr[index];
  arr[index] = arr[swapWith];
  arr[swapWith] = tmp;

  arr.forEach((item, i) => {
    item.order = i;
  });
}

export function reassignOrder<T extends { order: number }>(arr: T[]): void {
  arr.forEach((item, i) => {
    item.order = i;
  });
}
