let onHttpError = null;

export function setHttpErrorHandler(handler) {
  onHttpError = handler;
}

export function emitHttpError(error) {
  if (typeof onHttpError === 'function') {
    onHttpError(error);
  }
}
