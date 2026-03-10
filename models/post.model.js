const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Post extends Model {}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false,
      validate: {
        len: [3, 180],
      },
    },
    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    coverMediaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    socialTitle: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    socialDescription: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    socialImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
    },
  },
  {
    sequelize,
    modelName: 'Post',
    tableName: 'core_posts',
    timestamps: true,
  },
);

module.exports = Post;
