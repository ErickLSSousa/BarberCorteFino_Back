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

module.exports = {
  getPortfolioWorks,
  createPortfolioWork,
  deletePortfolioWork,
};