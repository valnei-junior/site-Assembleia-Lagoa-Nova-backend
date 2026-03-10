'use strict';

const departments = [
  { name: 'Familia', slug: 'familia', description: 'Departamento da familia' },
  { name: 'Jovens', slug: 'jovens', description: 'Departamento de jovens' },
  { name: 'Criancas', slug: 'criancas', description: 'Departamento infantil' },
  { name: 'Midia', slug: 'midia', description: 'Departamento de comunicacao e midia' },
  { name: 'Pastoral', slug: 'pastoral', description: 'Departamento pastoral' },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const existing = await queryInterface.sequelize.query(
      'SELECT slug FROM core_departments',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const existingSlugs = new Set((existing || []).map((row) => row.slug));

    const rows = departments
      .filter((item) => !existingSlugs.has(item.slug))
      .map((item) => ({
        ...item,
        active: true,
        createdAt: now,
        updatedAt: now,
      }));

    if (rows.length > 0) {
      await queryInterface.bulkInsert('core_departments', rows, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('core_departments', {
      slug: {
        [Sequelize.Op.in]: departments.map((item) => item.slug),
      },
    }, {});
  },
};
