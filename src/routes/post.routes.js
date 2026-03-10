const { Router } = require('express');
const controller = require('../controllers/post.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', auth, requireRole('admin', 'lider'), controller.create);
router.put('/:id', auth, requireRole('admin', 'lider'), controller.update);
router.delete('/:id', auth, requireRole('admin', 'lider'), controller.remove);

module.exports = router;
