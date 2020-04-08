[![npm](https://badgen.net/npm/v/i18next-node-mongo-backend?color=red)](https://www.npmjs.com/package/i18next-node-mongo-backend)
[![license](https://badgen.net/npm/license/i18next-node-mongo-backend)](https://github.com/laodemalfatih/i18next-node-mongo-backend/blob/master/LICENSE)

[![Build Status](https://travis-ci.com/laodemalfatih/i18next-node-mongo-backend.svg)](https://travis-ci.com/laodemalfatih/i18next-node-mongo-backend)
[![codecov](https://codecov.io/gh/laodemalfatih/i18next-node-mongo-backend/branch/master/graph/badge.svg)](https://codecov.io/gh/laodemalfatih/i18next-node-mongo-backend)
[![Maintainability](https://api.codeclimate.com/v1/badges/5fc60912b2776f1e1a53/maintainability)](https://codeclimate.com/github/laodemalfatih/i18next-node-mongo-backend/maintainability)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

#### Inspired from [i18next-node-mongodb-backend](https://github.com/gian788/i18next-node-mongodb-backend) with support for `mongodb@3.5.x` and some bug fixes and more improvements

# Integrate [i18next](https://github.com/i18next/i18next) with [MongoDB](https://www.mongodb.com/)

<img src="assets/i18next.png" alt="I18next Logo" width="100"/><img src="assets/mongodb.png" alt="MongoDB Logo" width="330" style="margin-left: 40px;"/>

# Introduction

This is a [i18next](https://github.com/i18next/i18next) backend to be used Node JS. It will load resources from a [MongoDB](https://www.mongodb.org) database with official node mongodb [driver](https://mongodb.github.io/node-mongodb-native/3.5/).

# Getting started

```bash
yarn add mongodb i18next-node-mongo-backend
# or
npm install mongodb i18next-node-mongo-backend
```

> Important: This library doesn't include `mongodb` library. You have to install it yourself

# Usage

```js
const i18next = require('i18next');
const Backend = require('i18next-node-mongo-backend');

i18next
  .use(Backend)
  .init({
    // Backend Options
    backend: options
  });
```

# Backend Options

```js
{
  // Database Name
  dbName: '<DB Name>', // Required

  // MongoDB Uri
  uri: '<DB URI>',

  // Or

   // MongoDB standard configuration
  host: '<DB Host>',
  port: 27017,

  // Or

  // If you have your own `MongoClient`, put in here:
  // Note: If this has already been entered, the other MongoDB configurations will be ignored
  client: new MongoClient(), // work with connected client or not

  // MongoDB authentication. Remove it if not needed
  user: '<DB User>',
  password: '<DB Password>',

  // Collection name in database will be used to store i18next data
  collectionName: 'i18n',

  // MongoDB field name
  languageFieldName: 'lang',
  namespaceFieldName: 'ns',
  dataFieldName: 'data',

  // Remove MongoDB special character from field name. See https://jira.mongodb.org/browse/SERVER-3229
  filterFieldNameCharacter: true,

  // Error handlers
  readOnError: console.error,
  readMultiOnError: console.error,
  createOnError: console.error,

  // MongoClient Options. See https://mongodb.github.io/node-mongodb-native/3.5/api/MongoClient.html
  mongodb: {
    useUnifiedTopology: true
  }
};
```

## Example Backend Options

#### Connect with `uri`:
```js
{
  uri: 'mongodb://localhost:27017/test',
  dbName: 'test' // Required field
}
```

#### Connect with `host` and `port`:
```js
{
  host: 'localhost',
  port: 27017,
  dbName: 'test' // Required field
}
```

#### Connect with `MongoClient` instance _(if you already have your own connection, use this to avoid useless connections)_ : Recommended
```js
{
  client: new MongoClient(), // Change with your MongoClient instance
  dbName: 'test', // Required field
}
```

## Example of the MongoDB document that will be created:
```json
// Key name is according to provided in options
{
  "lang" : "en-US",
  "ns" : "translations",
  "data" : {
    "key": "Thank you!"
  }
}
```

### See [examples](https://github.com/laodemalfatih/i18next-node-mongo-backend/tree/v0.0.4-examples) for more example

# Change Log:

### v0.0.4 _(08-04-20)_:
  - Critical bug fixed
  - Remove `persistConnection` option

### v0.0.3 _(DEPRECATED)_:
  - Add testing code with [Jest](https://jestjs.io/)
  - Add [JSDOC](https://jsdoc.app/)
  - Add support for the `uri` option
  - Add `filterFieldNameCharacter` option
  - Some improvements