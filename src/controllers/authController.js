const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const supabase = require("../config/supabase");
const HttpError = require("../utils/httpError");

function signToken(user, role) {
  return jwt.sign(
    { sub: user.id, email: user.email, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, name, email, password_hash, active")
      .eq("email", normalizedEmail)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      throw new HttpError(500, "Falha ao consultar administrador.");
    }

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      throw new HttpError(401, "E-mail ou senha invalidos.");
    }

    const token = signToken(admin, "admin");

    return res.json({
      token,
      role: "admin",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function registerClient(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const password_hash = await bcrypt.hash(password, 12);

    const { data: existingClient, error: lookupError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      throw new HttpError(500, "Falha ao consultar cliente.");
    }

    if (existingClient) {
      throw new HttpError(409, "Ja existe um cliente cadastrado com este e-mail.");
    }

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        name,
        email: normalizedEmail,
        phone,
        password_hash,
        active: true,
      })
      .select("id, name, email, phone, active")
      .single();

    if (error) {
      throw new HttpError(500, "Falha ao cadastrar cliente.");
    }

    const token = signToken(client, "client");

    return res.status(201).json({
      token,
      role: "client",
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function loginClient(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const { data: client, error } = await supabase
      .from("clients")
      .select("id, name, email, phone, password_hash, active")
      .eq("email", normalizedEmail)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      throw new HttpError(500, "Falha ao consultar cliente.");
    }

    if (!client || !(await bcrypt.compare(password, client.password_hash))) {
      throw new HttpError(401, "E-mail ou senha invalidos.");
    }

    const token = signToken(client, "client");

    return res.json({
      token,
      role: "client",
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login: loginAdmin,
  loginAdmin,
  loginClient,
  registerClient,
};
