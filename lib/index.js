'use strict';

var MongoClient = require('mongodb').MongoClient;

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

function getDefaults() {
  return {
    host: 'localhost',
    db: 'test',
    port: 27017,
    collection: '18next',
    options: {
      auto_reconnect: true,
      ssl: false,
      useUnifiedTopology: true
    }
  };
}

var Backend = (function() {
  function Backend(services) {
    var options =
      arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Backend);

    this.init(services, options);

    this.type = 'backend';
  }

  _createClass(Backend, [
    {
      key: 'init',
      value: function init(services, backendOptions) {
        var options =
          arguments.length <= 1 || arguments[1] === undefined
            ? {}
            : arguments[1];
        var coreOptions =
          arguments.length <= 2 || arguments[2] === undefined
            ? {}
            : arguments[2];

        this.services = services;
        this.options = this.options || {};

        const defaults = getDefaults();

        if (!this.options.uri) {
          const {
            host = defaults.host,
            port = defaults.port,
            db = defaults.db
          } = this.options;

          this.options.uri = `mongodb://${host}:${port}/${db}`;
        }
        this.options = _extends({}, defaults, this.options, options);

        this.coreOptions = coreOptions;
      }
    },
    {
      key: 'read',
      value: function read(language, namespace, callback) {
        var _self = this;

        if (!callback) return;

        MongoClient.connect(_self.options.uri, this.options.options, function(
          err,
          client
        ) {
          if (err) return console.error(err);

          const db = client.db(_self.options.db);

          db.createCollection(_self.options.collection, function(
            err,
            collection
          ) {
            if (err) return console.error(err);

            collection.findOne(
              { language: language, namespace: namespace },
              function(err, lang) {
                if (err) return callback(err);

                callback(null, lang ? lang.data : {});
                client.close();
              }
            );
          });
        });
      }
    },
    {
      key: 'readMulti',
      value: function read(languages, namespaces, callback) {
        var _self = this;

        if (!callback) return;
        if (typeof languages === 'string') languages = [languages];

        MongoClient.connect(_self.options.uri, this.options.options, function(
          err,
          client
        ) {
          if (err) return console.error(err);

          const db = client.db(_self.options.db);

          db.createCollection(_self.options.collection, function(
            err,
            collection
          ) {
            if (err) return console.error(err);

            collection.update(
              { language: { $in: languages }, namespace: { $in: namespaces } },
              function(err, langs) {
                if (err) return console.error(err);

                callback(null, _.pluck(langs, 'data'));
                client.close();
              }
            );
          });
        });
      }
    },
    {
      key: 'create',
      value: function create(
        languages,
        namespace,
        key,
        fallbackValue,
        callback
      ) {
        var _self = this;

        if (!callback) callback = function() {};
        if (typeof languages === 'string') languages = [languages];

        MongoClient.connect(_self.options.uri, this.options.options, function(
          err,
          client
        ) {
          if (err) return console.error(err);

          const db = client.db(_self.options.db);

          var set = {};
          set['data.' + key] = fallbackValue;
          db.createCollection(_self.options.collection, function(
            err,
            collection
          ) {
            if (err) return console.error(err);

            languages.forEach(function(lng) {
              collection.update(
                { language: lng, namespace: namespace },
                { $set: set },
                { upsert: true },
                function(err) {
                  if (err) return console.error(err);
                  client.close();
                }
              );
            });
          });
        });
      }
    }
  ]);

  return Backend;
})();

Backend.type = 'backend';

module.exports = Backend;
