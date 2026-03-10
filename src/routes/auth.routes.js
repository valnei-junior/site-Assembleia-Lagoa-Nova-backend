const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/register', auth, requireRole('admin'), controller.register);
router.post('/logout', auth, controller.logout);
router.get('/me', auth, controller.me);

module.exports = router;
