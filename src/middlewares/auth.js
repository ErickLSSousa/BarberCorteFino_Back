const jwt = require("jsonwebtoken");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Token de administrador ausente."));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role !== "admin") {
      return next(new HttpError(403, "Acesso administrativo necessario."));
    }

    req.admin = {
      id: payload.sub,
      email: payload.email,
    };
    return next();
  } catch {
    return next(new HttpError(401, "Token invalido ou expirado."));
  }
}

module.exports = requireAdmin;

