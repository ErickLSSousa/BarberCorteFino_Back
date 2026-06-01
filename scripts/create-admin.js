const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const supabase = require("../src/config/supabase");

async function main() {
  const rl = readline.createInterface({ input, output });

  const name = (await rl.question("Nome do administrador: ")).trim();
  const email = (await rl.question("E-mail do administrador: ")).trim().toLowerCase();
  const password = await rl.question("Senha temporaria (minimo 8 caracteres): ");
  rl.close();

  if (!name || !email || password.length < 8) {
    throw new Error("Nome, e-mail e senha com no minimo 8 caracteres sao obrigatorios.");
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from("admins")
    .insert({ name, email, password_hash, active: true })
    .select("id, email")
    .single();

  if (error) {
    throw error;
  }

  console.log(`Administrador criado: ${data.email} (${data.id})`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

