const sequelize = require('../config/database');
const Department = require('./department.model');
const User = require('./user.model');
const Post = require('./post.model');
const Media = require('./media.model');

Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Department.hasMany(Post, { foreignKey: 'departmentId', as: 'posts' });
Post.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

User.hasMany(Post, { foreignKey: 'authorId', as: 'authoredPosts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Post.hasMany(Media, { foreignKey: 'postId', as: 'media' });
Media.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(Media, { foreignKey: 'uploadedById', as: 'uploadedMedia' });
Media.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

const syncModels = async () => {
  await Department.sync({ alter: true });
  await User.sync({ alter: true });
  await Post.sync({ alter: true });
  await Media.sync({ alter: true });
};

module.exports = {
  sequelize,
  Department,
  User,
  Post,
  Media,
  syncModels,
};
