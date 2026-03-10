'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const adminEmail = String(process.env.ADMIN_DEFAULT_EMAIL || 'admin@adlagoanova.local').trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123');

    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM core_users WHERE email = :email LIMIT 1',
      {
        replacements: { email: adminEmail },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return;
    }

    await queryInterface.bulkInsert('core_users', [
      {
        name: 'Administrador',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: 'admin',
        departmentId: null,
        active: true,
        refreshTokenVersion: 0,
        createdAt: now,
        updatedAt: now,
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    const adminEmail = String(process.env.ADMIN_DEFAULT_EMAIL || 'admin@adlagoanova.local').trim().toLowerCase();

    await queryInterface.bulkDelete('core_users', {
      email: adminEmail,
    }, {});
  },
};
