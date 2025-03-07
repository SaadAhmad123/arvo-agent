/**
 * Validates if a string contains only uppercase or lowercase alphanumeric characters.
 *
 * This function checks if the input string consists solely of:
 * - Lowercase letters (a-z)
 * - Numbers (0-9)
 * - Dot (.)
 *
 * It does not allow any special characters, spaces, or other non-alphanumeric characters.
 *
 * @param input - The string to be validated.
 * @returns True if the string contains only alphanumeric characters, false otherwise.
 */
export function isLowerAlphanumeric(input: string): boolean {
  const alphanumericRegex = /^[a-z0-9.]+$/;
  return alphanumericRegex.test(input);
}
