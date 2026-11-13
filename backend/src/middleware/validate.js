/**
 * Input Validation Middleware Factory
 *
 * Location: backend/src/middleware/validate.js
 * Where it fits: Request processing pipeline. Runs before controllers.
 *
 * Why: Fail-fast security pattern. Validates and sanitizes all incoming request payloads
 * using strict Zod schemas before data touches controllers or business services.
 */

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`);
      return res.status(400).json({
        error: `Input validation failed: ${issues.join('; ')}`,
      });
    }
    req.body = result.data;
    next();
  };
}
