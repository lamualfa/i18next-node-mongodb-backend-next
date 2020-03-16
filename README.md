[![npm](https://badgen.net/npm/v/i18next-node-mongo-backend?color=red)](https://www.npmjs.com/package/i18next-node-mongo-backend)
[![npm downloads](https://badgen.net/npm/dt/i18next-node-mongo-backend)](https://www.npmjs.com/package/i18next-node-mongo-backend)
[![license](https://badgen.net/npm/license/i18next-node-mongo-backend)](https://github.com/laodemalfatih/i18next-node-mongo-backend/blob/master/LICENSE)

#### Inspired from [i18next-node-mongo-backend](https://github.com/gian788/i18next-node-mongo-backend) with support for `mongodb@3.5.x` and some bug fixes and more improvements

# Integrate [i18next](https://github.com/i18next/i18next) with [MongoDB](https://www.mongodb.com/)

<img src="assets/i18next.png" alt="I18next Logo" width="100"/><img src="assets/mongodb.png" alt="MongoDB Logo" width="350" style="margin-left: 30px;"/>

# Introduction

This is a [i18next](https://github.com/i18next/i18next) backend to be used node.js. It will load resources from a [MongoDB](https://www.mongodb.org) database with official node mongodb [driver](https://mongodb.github.io/node-mongodb-native/3.5/).

# Getting started

```bash
npm install mongodb i18next-node-mongo-backend
# or
yarn add mongodb i18next-node-mongo-backend
```

> Important: This library doesn't include `mongodb` library. You have to install it yourself

# Backend Options

```js
{
  // If you have your own MongoClient, put in here:
  // Note: If this has already been entered, the other MongoDB standard configurations will be ignored
  client: new MongoClient(),

  // MongoDB standard configuration
  host: '127.0.0.1',
  port: 27017,
  dbName: '<DB Name>',

  // MongoDB authentication. Remove it if not needed
  user: '<User>',
  password: '<Password>',

  // Collection name in database will be used to store i18next data
  collectionName: 'i18n',

  // MongoDB field name
  languageFieldName: 'lang',
  namespaceFieldName: 'ns',
  dataFieldName: 'data',

  // Error handlers
  readErrorHandler: console.error,
  readMultiErrorHandler: console.error,
  createErrorHandler: console.error,

  // MongoClient Options. See https://mongodb.github.io/node-mongodb-native/3.5/api/MongoClient.html
  mongodb: {
    auto_reconnect: true,
    useUnifiedTopology: true
  }
};
```

> We do not provide `uri` options. You just fill out the available options, we will do it automatically for you

# Usage

```js
const i18next = require('i18next');
const Backend = require('i18next-node-mongo-backend');

i18next.use(Backend).init({
  // Backend Options
  backend: options
});
```
