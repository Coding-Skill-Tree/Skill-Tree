export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function validationError(fields, message = '表單內容有誤') {
  return new HttpError(400, 'VALIDATION_ERROR', message, { fields });
}
