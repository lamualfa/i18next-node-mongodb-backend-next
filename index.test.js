const { MongoClient } = require('mongodb');

const Backend = require('./index');

const host = '127.0.0.1';
const port = 27017;
const user = 'test';
const password = 'test';
const dbName = 'test';
const collectionName = 'i18n';

// Use custom
const languageFieldName = 'lng';
const namespaceFieldName = 'nas';
const dataFieldName = 'dat';

const translations = [
  {
    [languageFieldName]: 'en',
    [namespaceFieldName]: 'translation',
    [dataFieldName]: {
      key: 'Hello world',
    },
  },
  {
    [languageFieldName]: 'id',
    [namespaceFieldName]: 'translation',
    [dataFieldName]: {
      key: 'Halo dunia',
    },
  },
  {
    [languageFieldName]: 'en',
    [namespaceFieldName]: 'translation-2',
    [dataFieldName]: {
      key2: 'Hello world 2',
    },
  },
  {
    [languageFieldName]: 'id',
    [namespaceFieldName]: 'translation-2',
    [dataFieldName]: {
      key2: 'Halo dunia 2',
    },
  },
];

const client = new MongoClient(`mongodb://${host}:${port}/${dbName}`, {
  useUnifiedTopology: true,
  auth: {
    user,
    password,
  },
});

function asyncify(backend, method, ...params) {
  return new Promise((resolve, reject) =>
    backend[method](...params, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    }),
  );
}

function basicReadTest(backend) {
  it('valid read result', async () => {
    // Concurrency read test
    await Promise.all(
      translations.map((translation) => async () => {
        expect(
          await asyncify(
            backend,
            'read',
            translation[languageFieldName],
            translation[namespaceFieldName],
          ),
        ).toBe(translation[dataFieldName]);
      }),
    );
  });
}

function basicReadMultiTest(backend) {
  it('valid readMulti result', async () => {
    const langs = [];
    const nss = [];
    const expectResult = {};

    translations.forEach((translation) => {
      const lang = translation[languageFieldName];
      const ns = translation[namespaceFieldName];

      if (langs.indexOf(lang) === -1) langs.push(lang);
      if (nss.indexOf(ns) === -1) nss.push(ns);

      if (expectResult[lang])
        expectResult[lang][ns] = translation[dataFieldName];
      else
        expectResult[lang] = {
          [ns]: translation[dataFieldName],
        };
    });

    expect(
      // eslint-disable-next-line no-await-in-loop
      await asyncify(backend, 'readMulti', langs, nss),
    ).toEqual(expectResult);
  });
}

function basicCreateTest(backend) {
  it('valid create new document', async () => {
    const testNs = 'translation';
    const testLang = 'es';
    const testKey = 'key';
    const testVal = 'hola mundo';

    await asyncify(backend, 'create', testLang, testNs, testKey, testVal);

    expect(await asyncify(backend, 'read', testLang, testNs)).toEqual({
      [testKey]: testVal,
    });
  });
}

async function emptyCollection() {
  await client.db(dbName).collection(collectionName).deleteMany({});
}

beforeAll(async () => {
  await client.connect();
  await client.db(dbName).createCollection(collectionName);
  await emptyCollection();
});

beforeEach(async () => {
  const updateTasks = [];

  const collection = await client.db(dbName).collection(collectionName);

  for (let i = 0; i < translations.length; i += 1) {
    const translation = translations[i];

    updateTasks.push(
      collection.updateOne(
        {
          [languageFieldName]: translation[languageFieldName],
          [namespaceFieldName]: translation[namespaceFieldName],
        },
        {
          $set: {
            [dataFieldName]: translation[dataFieldName],
          },
        },
        {
          upsert: true,
        },
      ),
    );
  }

  await Promise.all(updateTasks);
});

afterEach(async () => {
  // await emptyCollection();
});

afterAll(async () => {
  // await client.db(dbName).dropCollection(collectionName);
  await client.close();
});

it('Remove MongoDB special character', () => {
  const backend = new Backend(null, {
    languageFieldName: 'fie.ld',
    namespaceFieldName: '$ns',
    dataFieldName: '$da.ta',
  });

  expect(backend.opts.languageFieldName).toBe('field');
  expect(backend.opts.namespaceFieldName).toBe('ns');
  expect(backend.opts.dataFieldName).toBe('data');
});

describe('with custom MongoClient', () => {
  const backend = new Backend(null, {
    client,
    dbName,
    collectionName,
    languageFieldName,
    namespaceFieldName,
    dataFieldName,
    persistConnection: true,
  });

  basicReadTest(backend);
  basicReadMultiTest(backend);
  basicCreateTest(backend);
});

describe('with standard config', () => {
  const backend = new Backend(null, {
    host,
    port,
    user,
    password,
    dbName,
    collectionName,
    languageFieldName,
    namespaceFieldName,
    dataFieldName,
  });

  basicReadTest(backend);
  basicReadMultiTest(backend);
  basicCreateTest(backend);
});
