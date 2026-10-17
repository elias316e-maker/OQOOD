export function createTestId(
  prefix?: string,
): string {
  const uniquePart = [
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join("-");

  return prefix
    ? `${prefix}-${uniquePart}`
    : uniquePart;
}
