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
      .select("active")
      .eq("id", id)
      .single();

  if (findError) throw findError;

  const { data, error } =
    await supabase
      .from("portfolio_works")
      .update({
        active: !current.active,
      })
      .eq("id", id)
      .select()
      .single();

  if (error) throw error;

  return data;
}

module.exports = {
  getPortfolioWorks,
  createPortfolioWork,
  deletePortfolioWork,
  togglePortfolioWork,
};