const HttpError = require("../utils/httpError");

function validate(schema, source = "body") {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      return next(new HttpError(400, `Dados invalidos. ${message}`));
    }

    req[source] = parsed.data;
    return next();
  };
}

module.exports = validate;

