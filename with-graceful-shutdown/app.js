require('dotenv').config();

const { DB_HOST, DB_PORT, DB_NAME, I18N_COL_NAME } = process.env;

const i18next = require('i18next');
const Backend = require('i18next-node-mongo-backend');

const { initDatabase } = require('../libs/initDatabase');
const { initTranslations } = require('../libs/initTranslations');

let client;

async function main() {
  client = await initDatabase(DB_HOST, DB_PORT, DB_NAME);

  const col = await client.db(DB_NAME).createCollection(I18N_COL_NAME);
  await initTranslations(col);

  await i18next.use(Backend).init({
    backend: {
      client,
      dbName: DB_NAME,
      collectionName: I18N_COL_NAME,
      persistConnection: true
    }
  });

  // Translation for en
  const t_en = await i18next.changeLanguage('en');
  console.log(`en => key : ${t_en('key')}`);

  // Translation for id
  const t_id = await i18next.changeLanguage('id');
  console.log(`id => key : ${t_id('key')}`);
}

async function gracefulShutdown() {
  try {
    if (client && client.isConnected()) {
      console.log('Disconnect database...');
      await client.close();
      console.log('Database disconnected');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    console.error('Error graceful shutdown');
    process.exit(1);
  }
}

main()
  .then(async () => {
    console.log('Success');
    await gracefulShutdown();
  })
  .then(() => {
    process.exit(0);
  })
  .catch(console.error);
