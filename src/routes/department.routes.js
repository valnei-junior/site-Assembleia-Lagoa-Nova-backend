const { Router } = require('express');
const controller = require('../controllers/department.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', auth, requireRole('admin'), controller.create);
router.put('/:id', auth, requireRole('admin'), controller.update);
router.delete('/:id', auth, requireRole('admin'), controller.remove);

module.exports = router;
