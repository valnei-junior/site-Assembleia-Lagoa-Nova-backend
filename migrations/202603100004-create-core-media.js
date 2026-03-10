'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('core_media', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'core_posts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      uploadedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'core_users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM('image', 'video'),
        allowNull: false,
      },
      filename: {
        type: Sequelize.STRING(260),
        allowNull: false,
      },
      originalName: {
        type: Sequelize.STRING(260),
        allowNull: false,
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      thumbnailUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      altText: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: '',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('core_media', ['postId']);
    await queryInterface.addIndex('core_media', ['type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('core_media');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_core_media_type";');
  },
};
