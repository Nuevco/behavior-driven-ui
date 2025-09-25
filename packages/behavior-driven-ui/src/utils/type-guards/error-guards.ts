/**
 * Type guards for error objects using TypeScript utility types
 */

/**
 * Type for an error-like object with a code property
 */
type ErrorWithCode = Partial<Error> & { code: string };

/**
 * Type for an error-like object with a message property
 */
type ErrorWithMessage = Partial<Error> & { message: string };

/**
 * Type guard to check if an object has a code property
 */
export function hasCode(error: unknown): error is ErrorWithCode {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Type guard to check if an object has a message property
 */
export function hasMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Combined type guard to check if an object has both code and message
 */
export function hasCodeAndMessage(
  error: unknown
): error is ErrorWithCode & ErrorWithMessage {
  return hasCode(error) && hasMessage(error);
}
