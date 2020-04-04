const deepExtend = require('deep-extend');
const { MongoClient } = require('mongodb');

const defaultOpts = {
  host: '127.0.0.1',
  port: 27017,
  collectionName: 'i18n',
  languageFieldName: 'lang',
  namespaceFieldName: 'ns',
  dataFieldName: 'data',
  readErrorHandler: console.error,
  readMultiErrorHandler: console.error,
  createErrorHandler: console.error,
  mongodb: {
    auto_reconnect: true,
    useUnifiedTopology: true
  }
};

class Backend {
  constructor(services, opts = {}) {
    this.init(services, opts);
  }

  // Private methods

  async getCollection() {
    return await (this.client
      ? this.client.isConnected()
        ? this.client
        : await this.client.connect()
      : (this.client = await MongoClient.connect(this.uri, this.opts.mongodb))
    )
      .db(this.opts.dbName)
      .createCollection(this.opts.collectionName);
  }

  // i18next methods

  init(services, opts, i18nOpts) {
    this.services = services;

    this.opts = defaultOpts;
    deepExtend(this.opts, this.options, opts);

    if (this.opts.user && this.opts.password)
      this.opts.mongodb.auth = {
        user: this.opts.user,
        password: this.opts.password
      };

    // Cache Mongodb Connection
    this.client = this.opts.client || null;

    this.i18nOpts = i18nOpts;

    this.uri = `mongodb://${this.opts.host}:${this.opts.port}/${this.opts.dbName}`;
  }

  read(lang, ns, cb) {
    if (!cb) return;

    this.getCollection()
      .then(col =>
        col.findOne(
          {
            [this.opts.languageFieldName]: lang,
            [this.opts.namespaceFieldName]: ns
          },
          {
            [this.opts.dataFieldName]: true
          }
        )
      )
      .then(doc => cb(null, (doc && doc[this.opts.dataFieldName]) || {}))
      .catch(this.opts.readErrorHandler);
  }

  readMulti(langs, nss, cb) {
    if (!cb) return;

    this.getCollection()
      .then(col =>
        col
          .find({
            [this.opts.languageFieldName]: { $in: langs },
            [this.opts.namespaceFieldName]: { $in: nss }
          })
          .toArray()
      )
      .then(docs => {
        const parsed = {};

        for (let i = 0; i < docs.length; i += 1) {
          const doc = docs[i];
          const lang = doc[this.opts.languageFieldName];
          const ns = doc[this.opts.namespaceFieldName];
          const data = doc[this.opts.dataFieldName];

          if (!parsed[lang]) {
            parsed[lang] = {};
          }

          parsed[lang][ns] = data;
        }

        cb(null, parsed);
      })
      .catch(this.opts.readMultiErrorHandler);
  }

  create(langs, ns, key, fallbackVal, cb) {
    if (typeof langs === 'string') langs = [langs];

    this.getCollection()
      .then(col =>
        (async () => {
          for (let i = 0; i < langs.length; i += 1) {
            const lang = langs[i];

            await col.updateOne(
              {
                [this.opts.languageFieldName]: lang,
                [this.opts.namespaceFieldName]: ns
              },
              {
                $set: {
                  [`${this.opts.dataFieldName}.${key}`]: fallbackVal
                }
              },
              {
                upsert: true
              }
            );
          }
        })()
      )
      // Call cb if exists
      .then(() => cb && cb())
      .catch(this.opts.createErrorHandler);
  }
}

//https://www.i18next.com/misc/creating-own-plugins#make-sure-to-set-the-plugin-type
Backend.type = 'backend';

module.exports = Backend;
