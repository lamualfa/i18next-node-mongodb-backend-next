require('dotenv').config();

const { DB_HOST, DB_PORT, DB_NAME, I18N_COL_NAME, URI } = process.env;

const i18next = require('i18next');
const Backend = require('i18next-node-mongo-backend');

const { initDatabase } = require('../libs/initDatabase');
const { initTranslations } = require('../libs/initTranslations');

let client;

async function main() {
  client = await initDatabase(DB_HOST, DB_PORT, DB_NAME);

  const col = await client.db(DB_NAME).createCollection(I18N_COL_NAME);
  await initTranslations(col);
  client.close(); // close the connection after initTranslations as we are going to use uri option
  await i18next.use(Backend).init({
    backend: {
      uri: URI,
      collectionName: I18N_COL_NAME,
      persistConnection: false
    },
    fallbackLng: 'en',
    whitelist: ['en', 'es', 'jp', 'id'],
    nonExplicitWhitelist: true,
    ns: ['daily', 'translation'],
    preload: ['en', 'es', 'jp', 'id'],
  });

  // Translation for en
  const t_en = await i18next.changeLanguage('en');
  console.log(`en => key : ${t_en('key')}`);

  // Translation for id
  const t_id = await i18next.changeLanguage('id');
  console.log(`id => key : ${t_id('key')}`);

  // Translation for id
  const t_jp = await i18next.changeLanguage('jp');
  console.log(`id => key : ${t_jp('daily:world')}`);
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
