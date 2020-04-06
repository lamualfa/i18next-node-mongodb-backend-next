// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoClient } = require('mongodb');

const defaultOpts = {
  host: '127.0.0.1',
  port: 27017,
  collectionName: 'i18n',
  languageFieldName: 'lang',
  namespaceFieldName: 'ns',
  dataFieldName: 'data',
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
   * @param {string} [opts.host="127.0.0.1"] MongoDB Host
   * @param {number} [opts.port=27017] MongoDB Port
   * @param {string} [opts.user] MongoDB User
   * @param {string} [opts.password] MongoDB Password
   * @param {string} opts.dbName Database name for storing i18next data
   * @param {string} [opts.collectionName="i18n"] Collection name for storing i18next data
   * @param {string} [opts.languageFieldName="lang"] Field name for language attribute
   * @param {string} [opts.namespaceFieldName="ns"] Field name for namespace attribute
   * @param {string} [opts.dataFieldName="data"] Field name for data attribute
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
      if (this.opts.client) this.client = this.opts.client;
      else {
        if (this.opts.user && this.opts.password)
          this.opts.mongodb.auth = {
            user: this.opts.user,
            password: this.opts.password,
          };

        this.uri = `mongodb://${this.opts.host}:${this.opts.port}/${this.opts.dbName}`;
        this.client = new MongoClient(this.uri, this.opts.mongodb);
      }
    }

    if (!this.client.isConnected()) await this.client.connect();

    const collection = await this.client
      .db(this.opts.dbName)
      .createCollection(this.opts.collectionName);

    return collection;
  }

  async closeIfPersistConnection(prevParam) {
    if (!this.opts.persistConnection && this.client.isConnected()) {
      await this.client.close();
      delete this.client;
    }

    return prevParam;
  }

  // i18next methods

  init(services, opts, i18nOpts) {
    this.services = services;

    this.i18nOpts = i18nOpts;
    this.opts = { ...defaultOpts, ...this.options, ...opts };
  }

  read(lang, ns, cb) {
    if (!cb) return;

    this.getCollection()
      .then((col) =>
        col.findOne(
          {
            [this.opts.languageFieldName]: lang,
            [this.opts.namespaceFieldName]: ns,
          },
          {
            [this.opts.dataFieldName]: true,
          },
        ),
      )
      .then((prevParam) => this.closeIfPersistConnection(prevParam))
      .then((doc) => cb(null, (doc && doc[this.opts.dataFieldName]) || {}))
      .catch(this.opts.readOnError);
  }

  readMulti(langs, nss, cb) {
    if (!cb) return;

    this.getCollection()
      .then((col) =>
        col
          .find({
            [this.opts.languageFieldName]: { $in: langs },
            [this.opts.namespaceFieldName]: { $in: nss },
          })

          .toArray(),
      )
      .then((docs) => {
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

        return parsed;
      })
      .then((prevParam) => this.closeIfPersistConnection(prevParam))
      .then((parsed) => cb(null, parsed))
      .catch(this.opts.readMultiOnError);
  }

  create(langs, ns, key, fallbackVal, cb) {
    const parsedLangs = typeof langs === 'string' ? [langs] : langs;

    this.getCollection()
      .then((col) => {
        const updateTasks = [];

        for (let i = 0; i < parsedLangs.length; i += 1) {
          updateTasks.push(
            col.updateOne(
              {
                [this.opts.languageFieldName]: parsedLangs[i],
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
          );
        }

        return Promise.all(updateTasks);
      })
      .then(() => this.closeIfPersistConnection())
      // Call cb if exists
      .then(() => cb && cb())
      .catch(this.opts.createOnError);
  }
}

// https://www.i18next.com/misc/creating-own-plugins#make-sure-to-set-the-plugin-type
Backend.type = 'backend';

module.exports = Backend;
