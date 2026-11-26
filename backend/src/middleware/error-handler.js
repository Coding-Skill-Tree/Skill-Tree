import { randomUUID } from 'node:crypto';
import { HttpError } from '../lib/http-error.js';

export function requestContext(_request, response, next) {
  response.locals.requestId = randomUUID();
  next();
}

export function notFound(_request, _response, next) {
  next(new HttpError(404, 'NOT_FOUND', '找不到此 API'));
}

export function errorHandler(error, request, response, _next) {
  const parserError = error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
  const known = error instanceof HttpError;
  const status = known ? error.status : error.type === 'entity.too.large' ? 413 : parserError ? 400 : 500;
  if (!known && !parserError) console.error('Unhandled API error', { requestId: response.locals.requestId, path: request.path, error });

  const payload = {
    success: false,
    error: {
      code: known ? error.code : error.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : parserError ? 'INVALID_JSON' : 'INTERNAL_ERROR',
      message: known ? error.message : error.type === 'entity.too.large' ? '請求內容超過大小限制' : parserError ? 'JSON 格式錯誤' : '系統發生錯誤，請稍後再試',
      requestId: response.locals.requestId,
    },
  };
  if (known && error.details !== undefined) {
    payload.error.details = error.details;
    if (error.details?.fields) payload.error.fields = error.details.fields;
  }
  response.status(status).json(payload);
}
