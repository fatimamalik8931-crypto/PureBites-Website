// =========================================================
//  asyncHandler — wraps an async route handler so any rejected
//  promise is forwarded to Express's error middleware instead
//  of crashing the process or hanging the request.
//
//  Usage:  router.get('/', asyncHandler(async (req, res) => { ... }))
// =========================================================

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
