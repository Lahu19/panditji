'use strict';
const router   = require('express').Router();
const Category = require('../models/Category');
const { authRequired } = require('../middleware/auth');

/* GET /api/categories — list all active */
router.get('/', async (req, res, next) => {
  try {
    const { parent } = req.query;
    const filter = { isActive: true };
    if (parent) filter.parentCategoryId = parent === 'root' ? null : parent;

    const cats = await Category.find(filter).sort({ displayOrder: 1, name: 1 });
    res.json({ categories: cats });
  } catch (err) { next(err); }
});

/* GET /api/categories/:id — accepts ObjectId or slug */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };
    const cat = await Category.findOne(query);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: cat });
  } catch (err) { next(err); }
});

/* POST /api/categories — admin only */
router.post('/', authRequired, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const cat = await Category.create({ ...req.body, createdBy: req.user.id, modifiedBy: req.user.id });
    res.status(201).json({ category: cat });
  } catch (err) { next(err); }
});

/* PATCH /api/categories/:id */
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const cat = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: cat });
  } catch (err) { next(err); }
});

/* DELETE /api/categories/:id — soft delete */
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    await Category.findByIdAndUpdate(req.params.id, { isDeleted: true, modifiedBy: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
