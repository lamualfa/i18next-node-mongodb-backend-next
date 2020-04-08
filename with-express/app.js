require('dotenv').config();

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  I18N_COL_NAME,
  SERVER_HOST,
  SERVER_PORT,
} = process.env;

const express = require('express');
const i18next = require('i18next');
const expressMiddleware_i18next = require('i18next-express-middleware');
const Backend = require('i18next-node-mongo-backend');

const initDatabase = require('../libs/initDatabase');
const initTranslations = require('../libs/initTranslations');

const translations = require('./translations');

let client;
let server;

async function main() {
  // DB
  client = await initDatabase(DB_HOST, DB_PORT, DB_NAME);

  const col = await client.db(DB_NAME).createCollection(I18N_COL_NAME);
  await initTranslations(col, translations);

  // I18n
  await i18next
    .use(expressMiddleware_i18next.LanguageDetector)
    .use(Backend)
    .init({
      fallbackLng: 'en',
      backend: {
        client,
        dbName: DB_NAME,
        collectionName: I18N_COL_NAME,
      },
    });

  // Server
  console.log('Init server...');
  server = express();
  server.use(
    expressMiddleware_i18next.handle(i18next, {
      // removeLngFromUrl: false
    })
  );

  server.get('/', function (req, res) {
    res.redirect('/key');
  });

  server.get('/:key', function (req, res) {
    res.type('html').send(
      `
      <p><b>Current language:</b> ${req.language}</p>
      <p><b>Key:</b> ${req.params.key}</p>
      <p><b>Translate:</b> ${req.t(req.params.key)}</p>

      <p><b>Change language:</b> ${translations
        .map(({ lang }) => `<a href="?lng=${lang}">${lang.toUpperCase()}</a>`)
        .join('/')}</p>
    `
    );
  });

  server = await server.listen(SERVER_PORT, SERVER_HOST);
  console.log(`Server listening on http://${SERVER_HOST}:${SERVER_PORT}/`);
}

// Run this to shutdown application
async function gracefulShutdown() {
  try {
    if (server) {
      console.log('Shutdown server...');
      await new Promise((resolve) =>
        server.close(() => {
          resolve();
        })
      );
      console.log('Server has been shutdown');
    }

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

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

main().catch(console.error);
