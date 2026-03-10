const { Router } = require('express');
const controller = require('../controllers/media.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { requirePostDepartmentOrAdmin } = require('../middlewares/post-access.middleware');
const upload = require('../middlewares/upload.middleware');

const router = Router();

router.get('/', controller.list);
router.get('/:id/download', controller.download);
router.post('/', auth, requireRole('admin', 'lider'), upload.array('files', 10), requirePostDepartmentOrAdmin, controller.uploadMany);
router.put('/:id', auth, requireRole('admin', 'lider'), controller.update);
router.delete('/:id', auth, requireRole('admin', 'lider'), controller.remove);

module.exports = router;
