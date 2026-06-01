const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const supabase = require("../config/supabase");
const HttpError = require("../utils/httpError");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

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

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: "admin" },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN },
    );

    return res.json({
      token,
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

module.exports = {
  login,
};

