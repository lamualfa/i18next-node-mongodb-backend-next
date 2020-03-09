[![npm](https://badgen.net/npm/v/i18next-node-mongo-backend?color=red)](https://www.npmjs.com/package/i18next-node-mongo-backend)
[![npm downloads](https://badgen.net/npm/dt/i18next-node-mongo-backend)](https://www.npmjs.com/package/i18next-node-mongo-backend)
[![license](https://badgen.net/npm/license/i18next-node-mongo-backend)](https://github.com/laodemalfatih/i18next-node-mongo-backend/blob/master/LICENSE)

## Forked from [i18next-node-mongodb-backend](https://github.com/gian788/i18next-node-mongodb-backend) with support for `mongodb@3.5.x` and some improvements

<img src="assets/i18next.png" alt="I18next Logo" width="100"/><img src="assets/mongodb.png" alt="MongoDB Logo" width="350" style="margin-left: 30px;"/>

# Introduction

This is a [i18next](i18next.com) backend to be used node.js. It will load resources from a [MongoDB](https://www.mongodb.org) database.

# Getting started

Source can be loaded via [npm](https://www.npmjs.com/package/i18next-node-mongodb-backend).

```bash
npm install mongodb i18next-node-mongo-backend
```

> Important: This library doesn't include `mongodb` library. You have to install it.

Wiring up:

```js
var i18next = require('i18next');
var Backend = require('i18next-node-mongo-backend');

i18next.use(Backend).init(i18nextOptions);
```

As with all modules you can either pass the constructor function (class) to the i18next.use or a concrete instance.

## Backend Options

```js
{
  host: 'localhost',
  port: 27017,
  db: 'i18next-mongodb-test',

  // or (choose one)
  uri: 'mongodb://localhost:27017/i18next-mongo-test',

  // collection containing i18next data
  collection: 'i18next',

  // optional mongoDB connection options
  // See http://mongodb.github.io/node-mongodb-native/3.5/api/MongoClient.html#.connect
  options: {
    // Auth option can be passed in here
    // Example:
    auth: {
      username: 'root',
      password: 'password'
    }
  }
}
```

Options can be passed in:

**preferred** - by setting options.backend in i18next.init:

```js
var i18next = require('i18next');
var Backend = require('i18next-node-mongo-backend');

i18next.use(Backend).init({
  backend: options
});
```

on construction:

```js
var Backend = require('i18next-node-mongo-backend');
var backend = new Backend(null, options);
```

by calling init:

```js
var Backend = require('i18next-node-mongo-backend');
var backend = new Backend();
backend.init(options);
```
