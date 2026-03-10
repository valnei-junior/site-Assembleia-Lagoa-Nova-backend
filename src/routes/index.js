const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const departmentRoutes = require('./department.routes');
const postRoutes = require('./post.routes');
const mediaRoutes = require('./media.routes');
const departmentEventsCompatRoutes = require('./department-events-compat.routes');
const uploadCompatRoutes = require('./upload-compat.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/posts', postRoutes);
router.use('/media', mediaRoutes);
router.use('/', departmentEventsCompatRoutes);
router.use('/', uploadCompatRoutes);

module.exports = router;
