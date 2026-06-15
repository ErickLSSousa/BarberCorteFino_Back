const portfolioService = require("../services/portfolioService");
const supabase = require("../config/supabase");

async function listPortfolioAdmin(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("portfolio_works")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return res.json({
      works: data,
    }); 
  } catch (error) {
    next(error);
  }
}

async function uploadImage(req, res, next) {
  try {

    if (!req.file) {
      return res.status(400).json({
        message: "Imagem obrigatória",
      });
    }

    const fileName =
      `${Date.now()}-${req.file.originalname}`;

    const { error } =
      await supabase.storage
        .from("portfolio-images")
        .upload(
          fileName,
          req.file.buffer,
          {
            contentType:
              req.file.mimetype,
          }
        );

    if (error) throw error;

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(fileName);

    return res.json({
      url:
        publicUrlData.publicUrl,
    });

  } catch (error) {
    next(error);
  }
}

async function listPortfolio(req, res, next) {
  try {
    const works =
      await portfolioService.getPortfolioWorks();

    return res.json({
      works,
    });
  } catch (error) {
    next(error);
  }
}

async function createPortfolio(req, res, next) {
  try {
    const work =
      await portfolioService.createPortfolioWork(
        req.body
      );

    return res.status(201).json(work);
  } catch (error) {
    next(error);
  }
}

async function removePortfolio(req, res, next) {
  try {
    await portfolioService.deletePortfolioWork(
      req.params.id
    );

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function togglePortfolio(req, res, next) {
  try {

    const work =
      await portfolioService.togglePortfolioWork(
        req.params.id
      );

    return res.json(work);

  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPortfolio,
  createPortfolio,
  removePortfolio,
  togglePortfolio,
  uploadImage,
  listPortfolioAdmin,
};  
