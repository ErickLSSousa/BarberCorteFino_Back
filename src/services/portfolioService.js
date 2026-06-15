const supabase = require("../config/supabase");

async function getPortfolioWorks() {
  const { data, error } = await supabase
    .from("portfolio_works")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

async function createPortfolioWork(payload) {
  const { data, error } = await supabase
    .from("portfolio_works")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

async function deletePortfolioWork(id) {
  const { error } = await supabase
    .from("portfolio_works")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

async function togglePortfolioWork(id) {

  const { data: current, error: findError } =
    await supabase
      .from("portfolio_works")
      .select("*")
      .eq("id", id)
      .single();

  console.log("REGISTRO ATUAL:");
  console.log(current);

  if (findError) throw findError;

  const newValue = !current.active;

  console.log("NOVO VALOR:");
  console.log(newValue);

  const { data, error } =
    await supabase
      .from("portfolio_works")
      .update({
        active: newValue,
      })
      .eq("id", id)
      .select("*")
      .single();

  console.log("REGISTRO ATUALIZADO:");
  console.log(data);

  if (error) throw error;

  return data;
}

module.exports = {
  getPortfolioWorks,
  createPortfolioWork,
  deletePortfolioWork,
  togglePortfolioWork,
};