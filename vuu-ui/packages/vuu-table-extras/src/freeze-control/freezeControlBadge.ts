/**
 * Calculates the badge value and overflow state for FreezeControl
 * It should max at 99, and when this is exceeded show 99+
 *
 * @param newRecordCount - int of new records
 * @returns An object with `badgeValue` (the displayed number, max 99) and `isOverflow` (whether count exceeds 99)
 */
export const calculateBadgeState = (newRecordCount: number) => {
  const badgeValue = Math.min(newRecordCount, 99);
  const isOverflow = newRecordCount > 99;
  return { badgeValue, isOverflow };
};
