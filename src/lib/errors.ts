export class AppError extends Error {
  constructor(message: string, public readonly code: string = "APP_ERROR") {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function logServerError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}
