/**
 * Error thrown when an error occurs due to user's actions
 */
export class UserAppError extends Error {
  constructor(msg: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UserAppError.prototype);
  }
}