// =========================================================
//  validate — reusable request validation middleware.
//
//  Give it Zod schemas for any of `params`, `query`, `body`.
//  The parsed (and coerced/cleaned) values are attached to
//  `req.valid`; the raw req.query / req.params are left alone
//  (in Express 5 req.query is read-only anyway).
//
//  A failed parse throws a ZodError, which the central
//  errorHandler turns into a 400 with per-field messages.
//
//  Usage:
//    router.get('/:id',
//      validate({ params: itemParamsSchema, query: listQuerySchema }),
//      asyncHandler(handler));
//
//    // inside the handler:
//    const { id } = req.valid.params;
// =========================================================

export const validate = (schemas = {}) => (req, _res, next) => {
  try {
    const valid = {};
    if (schemas.params) valid.params = schemas.params.parse(req.params);
    if (schemas.query) valid.query = schemas.query.parse(req.query);
    if (schemas.body) valid.body = schemas.body.parse(req.body);
    req.valid = valid;
    next();
  } catch (err) {
    next(err);
  }
};
