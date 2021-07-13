require("dotenv").config();

const { DB_HOST, DB_PORT, DB_NAME, I18N_COL_NAME } = process.env;

const i18next = require("i18next");
const Backend = require("i18next-node-mongodb-backend-next");

const initDatabase = require("../libs/initDatabase");
const initTranslations = require("../libs/initTranslations");

const translations = require("./translations");

let client;

async function main() {
  client = await initDatabase(DB_HOST, DB_PORT, DB_NAME);

  const col = await client.db(DB_NAME).createCollection(I18N_COL_NAME);
  await initTranslations(col, translations);

  // You can have 2 more connections to the same database in one application. so the connection above does not need to be closed. The connection above is used as an example for Graceful Shutdown concept

  await i18next.use(Backend).init({
    backend: {
      uri: `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`,
      dbName: DB_NAME,
      collectionName: I18N_COL_NAME,
    },
  });

  for (let i = 0; i < translations.length; i += 1) {
    const { lang, ns, data } = translations[i];

    const t = await i18next.changeLanguage(lang);

    Object.entries(data).forEach(([key]) =>
      console.log(`${lang} => ${ns}/${key} : ${t(`${ns}:${key}`)}`)
    );
  }
}

async function gracefulShutdown() {
  try {
    if (client && client.isConnected()) {
      console.log("Disconnect database...");
      await client.close();
      console.log("Database disconnected");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    console.error("Error graceful shutdown");
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("Success");
    return gracefulShutdown();
  })
  .then(() => process.exit(0))
  .catch(console.error);
