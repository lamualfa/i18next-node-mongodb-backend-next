// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoClient } = require('mongodb');

// Remove MongoDB special character. See https://jira.mongodb.org/browse/SERVER-3229?focusedCommentId=36821&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-36821
const MONGODB_SPECIAL_CHARACTER_REGEX = /^\$|\./g;

const defaultOpts = {
  host: '127.0.0.1',
  port: 27017,
  collectionName: 'i18n',
  languageFieldName: 'lang',
  namespaceFieldName: 'ns',
  dataFieldName: 'data',
  filterFieldNameCharacter: true,
  persistConnection: false,
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
   * @param {string} [opts.uri] MongoDB Uri
   * @param {string} [opts.host="127.0.0.1"] MongoDB Host
   * @param {number} [opts.port=27017] MongoDB Port
   * @param {string} [opts.user] MongoDB User
   * @param {string} [opts.password] MongoDB Password
   * @param {string} opts.dbName Database name for storing i18next data
   * @param {string} [opts.collectionName="i18n"] Collection name for storing i18next data
   * @param {string} [opts.languageFieldName="lang"] Field name for language attribute
   * @param {string} [opts.namespaceFieldName="ns"] Field name for namespace attribute
   * @param {string} [opts.dataFieldName="data"] Field name for data attribute
   * @param {boolean} [opts.filterFieldNameCharacter=true] Remove MongoDB special character (contains ".", or starts with "$"). See https://jira.mongodb.org/browse/SERVER-3229
   * @param {boolean} [opts.persistConnection=false] If false, then the database connection will be closed every time the i18next event completes
   * @param {MongoClient} [opts.client] Custom `MongoClient` instance
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

  async getCollection() {
    if (!this.client) {
      this.client = this.opts.client
        ? this.opts.client
        : new MongoClient(
            this.opts.uri ||
              `mongodb://${this.opts.host}:${this.opts.port}/${this.opts.dbName}`,
            this.opts.mongodb,
          );
    }

    if (!this.client.isConnected()) await this.client.connect();

    const collection = await this.client
      .db(this.opts.dbName)
      .createCollection(this.opts.collectionName);

    return collection;
  }

  async closeConnection() {
    if (this.client.isConnected()) await this.client.close();

    delete this.client;
  }

  // i18next required methods

  init(services, opts, i18nOpts) {
    this.services = services;

    this.i18nOpts = i18nOpts;
    this.opts = { ...defaultOpts, ...this.options, ...opts };

    if (this.opts.filterFieldNameCharacter) {
      this.opts.languageFieldName = this.opts.languageFieldName.replace(
        MONGODB_SPECIAL_CHARACTER_REGEX,
        '',
      );
      this.opts.namespaceFieldName = this.opts.namespaceFieldName.replace(
        MONGODB_SPECIAL_CHARACTER_REGEX,
        '',
      );
      this.opts.dataFieldName = this.opts.dataFieldName.replace(
        MONGODB_SPECIAL_CHARACTER_REGEX,
        '',
      );
    }

    if (this.opts.user && this.opts.password)
      this.opts.mongodb.auth = {
        user: this.opts.user,
        password: this.opts.password,
      };
  }

  read(lang, ns, cb) {
    if (!cb) return;

    this.getCollection()
      .then(async (col) => {
        const doc = await col.findOne(
          {
            [this.opts.languageFieldName]: lang,
            [this.opts.namespaceFieldName]: ns,
          },
          {
            [this.opts.dataFieldName]: true,
          },
        );

        if (!this.opts.persistConnection) await this.closeConnection();
        cb(null, (doc && doc[this.opts.dataFieldName]) || {});
      })
      .catch(this.opts.readOnError);
  }

  readMulti(langs, nss, cb) {
    if (!cb) return;

    this.getCollection()
      .then(async (col) => {
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

        if (!this.opts.persistConnection) await this.closeConnection();
        cb(null, parsed);
      })
      .catch(this.opts.readMultiOnError);
  }

  create(langs, ns, key, fallbackVal, cb) {
    this.getCollection()
      .then(async (col) => {
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
        if (!this.opts.persistConnection) await this.closeConnection();

        if (cb) cb();
      })
      .catch(this.opts.createOnError);
  }
}

// https://www.i18next.com/misc/creating-own-plugins#make-sure-to-set-the-plugin-type
Backend.type = 'backend';

module.exports = Backend;
