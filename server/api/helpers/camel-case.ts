// Helper function to convert snake_case to camelCase
export const snakeToCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
};

/**
 * Recursively converts all object keys from snake_case to camelCase.
 * Handles nested objects and arrays.
 */
export function convertKeysToCamelCase<T>(input: T): T {
  if (Array.isArray(input)) {
    // Recursively convert each item in the array
    return input.map(convertKeysToCamelCase) as unknown as T;
  } else if (input !== null && typeof input === "object") {
    // Preserve Date instances (and other non-plain objects) as-is
    if (input instanceof Date) {
      return input;
    }
    // Recursively convert each key in the object
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>,
    )) {
      const camelKey = snakeToCamelCase(key);
      result[camelKey] = convertKeysToCamelCase(value);
    }
    return result as T;
  }
  return input;
}
