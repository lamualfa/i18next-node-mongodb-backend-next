// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoClient } = require('mongodb');

const sanitizeFieldNameCharacter = require('./libs/sanitizeFieldNameCharacter');

const defaultOpts = {
  collectionName: 'i18n',
  languageFieldName: 'lang',
  namespaceFieldName: 'ns',
  dataFieldName: 'data',
  sanitizeFieldNameCharacter: true,
  // eslint-disable-next-line no-console
  readOnError: console.error,
  // eslint-disable-next-line no-console
  readMultiOnError: console.error,
  // eslint-disable-next-line no-console
  createOnError: console.error,
  mongodb: {
    useUnifiedTopology: true,
  },
};

// https://www.i18next.com/misc/creating-own-plugins#backend

class Backend {
  /**
   * @param {*} services `i18next.services`
   * @param {object} opts Backend Options
   * @param {string} opts.uri MongoDB Uri
   * @param {string} opts.host MongoDB Host
   * @param {number} opts.port MongoDB Port
   * @param {MongoClient} opts.client Use your custom `MongoClient` instance. Example: `new MongoClient()`
   * @param {string} [opts.username] MongoDB Username
   * @param {string} [opts.user] MongoDB Username
   * @param {string} [opts.password] MongoDB Password
   * @param {string} opts.dbName Database name for storing i18next data
   * @param {string} [opts.collectionName="i18n"] Collection name for storing i18next data
   * @param {string} [opts.languageFieldName="lang"] Field name for language attribute
   * @param {string} [opts.namespaceFieldName="ns"] Field name for namespace attribute
   * @param {string} [opts.dataFieldName="data"] Field name for data attribute
   * @param {boolean} [opts.sanitizeFieldNameCharacter=true] Remove MongoDB special character (contains ".", or starts with "$"). See https://jira.mongodb.org/browse/SERVER-3229
   * @param {function} [opts.readOnError] Error handler for `read` process
   * @param {function} [opts.readMultiOnError] Error handler for `readMulti` process
   * @param {function} [opts.createOnError] Error handler for `create` process
   * @param {object} [opts.mongodb] `MongoClient` Options. See https://mongodb.github.io/node-mongodb-native/3.5/api/MongoClient.html
   * @param {boolean} [opts.mongodb.useUnifiedTopology=true]
   */
  constructor(services, opts = {}) {
    this.init(services, opts);
  }

  // Private methods

  async getClient() {
    const client = this.client || new MongoClient(this.uri, this.opts.mongodb);
    if (!client.isConnected || !client.isConnected()) {
      await client.connect();
    }
    return client;
  }

  async closeClientIfNeeded(client) {
    if (this.client) return;

    await client.close();
  }

  async getCollection(client) {
    const collections = await client
      .db(this.opts.dbName)
      .listCollections()
      .toArray();
    const isCollectionExists = collections.some(
      (collection) => collection.name === this.opts.collectionName,
    );
    if (isCollectionExists) {
      return client.db(this.opts.dbName).collection(this.opts.collectionName);
    }

    return client
      .db(this.opts.dbName)
      .createCollection(this.opts.collectionName);
  }

  sanitizeOpts(opts) {
    this.opts = { ...defaultOpts, ...this.options, ...opts };

    if (this.opts.sanitizeFieldNameCharacter) {
      this.opts.languageFieldName = sanitizeFieldNameCharacter(
        this.opts.languageFieldName,
      );
      this.opts.namespaceFieldName = sanitizeFieldNameCharacter(
        this.opts.namespaceFieldName,
      );
      this.opts.dataFieldName = sanitizeFieldNameCharacter(
        this.opts.dataFieldName,
      );
    }
  }

  // i18next required methods

  init(services, opts, i18nOpts) {
    this.services = services;
    this.i18nOpts = i18nOpts;
    this.sanitizeOpts(opts);

    if (this.opts.client) {
      this.client = this.opts.client;
      return;
    }

    this.uri =
      this.opts.uri ||
      `mongodb://${this.opts.host}:${this.opts.port}/${this.opts.dbName}`;

    const username = this.opts.user || this.opts.username;
    if (username && this.opts.password)
      this.opts.mongodb.auth = {
        user: username,
        username,
        password: this.opts.password,
      };
  }

  async read(lang, ns, cb) {
    if (!cb) return;

    const client = await this.getClient();
    try {
      const col = await this.getCollection(client);
      const doc = await col.findOne(
        {
          [this.opts.languageFieldName]: lang,
          [this.opts.namespaceFieldName]: ns,
        },
        {
          [this.opts.dataFieldName]: true,
        },
      );

      cb(null, (doc && doc[this.opts.dataFieldName]) || {});
    } catch (error) {
      this.opts.readOnError(error);
      cb(error);
    } finally {
      await this.closeClientIfNeeded(client);
    }
  }

  async readMulti(langs, nss, cb) {
    if (!cb) return;

    const client = await this.getClient();
    try {
      const col = await this.getCollection(client);

      const docs = await col
        .find({
          [this.opts.languageFieldName]: { $in: langs },
          [this.opts.namespaceFieldName]: { $in: nss },
        })
        .toArray();

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
    } catch (error) {
      this.opts.readMultiOnError(error);
      cb(error);
    } finally {
      await this.closeClientIfNeeded(client);
    }
  }

  async create(langs, ns, key, fallbackVal, cb) {
    const client = await this.getClient();
    try {
      const col = await this.getCollection(client);

      // Make `updateOne` process run concurrently
      await Promise.all(
        (typeof langs === 'string' ? [langs] : langs).map((lang) =>
          col.updateOne(
            {
              [this.opts.languageFieldName]: lang,
              [this.opts.namespaceFieldName]: ns,
            },
            {
              $set: {
                [`${this.opts.dataFieldName}.${key}`]: fallbackVal,
              },
            },
            {
              upsert: true,
            },
          ),
        ),
      );

      cb();
    } catch (error) {
      this.opts.createOnError(error);
      cb(error);
    } finally {
      await this.closeClientIfNeeded(client);
    }
  }
}

// https://www.i18next.com/misc/creating-own-plugins#make-sure-to-set-the-plugin-type
Backend.type = 'backend';

module.exports = Backend;
