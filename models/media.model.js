const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Media extends Model {}

Media.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uploadedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING(260),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(260),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    altText: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName: 'Media',
    tableName: 'core_media',
    timestamps: true,
  },
);

module.exports = Media;
