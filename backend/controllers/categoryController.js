const { getCategories } = require('../services/categoryService');

const handleGetCategories = async (req, res) => {
  try {
    const { module } = req.query;
    const data = await getCategories({ module });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[categoryController.getCategories]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { handleGetCategories };