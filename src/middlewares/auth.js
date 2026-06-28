const jwt = require("jsonwebtoken");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function verifyRole(req, role) {
  const token = getBearerToken(req);

  if (!token) {
    throw new HttpError(401, "Token de autenticacao ausente.");
  }

  const payload = jwt.verify(token, env.JWT_SECRET);
  if (payload.role !== role) {
    throw new HttpError(403, "Acesso nao autorizado para este perfil.");
  }

  return payload;
}

function requireAdmin(req, res, next) {
  try {
    const payload = verifyRole(req, "admin");
    req.admin = {
      id: payload.sub,
      email: payload.email,
    };
    return next();
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }
    return next(new HttpError(401, "Token invalido ou expirado."));
  }
}

function requireClient(req, res, next) {
  try {
    const payload = verifyRole(req, "client");
    req.client = {
      id: payload.sub,
      email: payload.email,
    };
    return next();
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }
    return next(new HttpError(401, "Token invalido ou expirado."));
  }
}

module.exports = requireAdmin;
module.exports.requireAdmin = requireAdmin;
module.exports.requireClient = requireClient;
