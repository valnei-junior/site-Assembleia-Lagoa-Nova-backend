require('dotenv').config();

const buildConfig = () => {
  if (process.env.DATABASE_URL) {
    const common = {
      url: process.env.DATABASE_URL,
      dialect: 'postgres',
      logging: false,
    };

    if (process.env.NODE_ENV === 'production') {
      common.dialectOptions = {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      };
    }

    return common;
  }

  return {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ad_lagoa_nova',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
    logging: false,
  };
};

module.exports = {
  development: buildConfig(),
  test: buildConfig(),
  production: buildConfig(),
};
