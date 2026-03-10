'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('core_posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'core_departments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'core_users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      title: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(220),
        allowNull: false,
        unique: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      coverMediaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      socialTitle: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      socialDescription: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      socialImageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'published'),
        allowNull: false,
        defaultValue: 'draft',
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

    await queryInterface.addIndex('core_posts', ['departmentId']);
    await queryInterface.addIndex('core_posts', ['authorId']);
    await queryInterface.addIndex('core_posts', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('core_posts');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_core_posts_status";');
  },
};
