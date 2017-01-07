var assert = require('power-assert');
var atomus = require('atomus');
var path = require('path');

describe('Some boring tests.', function() {

  var C = {
    prefix: 'mmle-storage__',
    cookie: {
      dead: new Date('1970/01/01 00:00:00')
    }
  };

  var o = {
    key: 'abc99',
    value: {
      name: 'pipi'
    }
  };

  var testTargets = [
    path.resolve(__dirname, '../dist/mmle-storage.js'),
    path.resolve(__dirname, '../dist/mmle-storage-compressor.js') // with LZ-string
  ];

  testTargets.forEach(function(src) {

    describe('Test with localStorage.(' + src + ')', function() {
      var context;
      var storage;

      beforeEach(function(done) {
        if (!context) {
          atomus()
            .html('')
            .external(src)
            .ready(function(err, window) {
              // localStorage mock
              window.localStorage = {
                getItem: function (key) {
                  return this[key];
                },
                setItem: function (key, value) {
                  this[key] = value;
                },
                removeItem: function(key) {
                  delete this[key];
                },
                clear: function() {
                  Object.keys(this)
                    .forEach(function(key) {
                      if (!['getItem', 'setItem', 'removeItem', 'clear'].includes(key)) {
                        delete this[key];
                      }
                    });
                }
              };

              context = window;
              storage = window.mmle.storage;
              done();
            });
        } else {
          done();
        }
      });

      afterEach(function() {
        context.localStorage.clear();
      });

      it('should set and get via localStorage', function() {
        storage.set(o.key, o.value);
        assert.deepEqual(storage.get(o.key), o.value);
      });

      it('should set the value with pre-defined prefix', function() {
        storage.set(o.key, o.value);
        assert(context.localStorage.getItem(C.prefix + o.key) != null);
      });

      it('set and get via localstorage if date is not expired', function(done) {
        var futureTime = new Date(new Date().getTime() + 60 * 1000);

        storage.setWithExpire(o.key, o.value, futureTime);

        setTimeout(function() {
          assert.deepEqual(storage.getWithExpire(o.key), o.value);
          done();
        }, 300);
      });

      it('set and get via localstorage if date expired', function(done) {
        var futureTime = new Date(new Date().getTime() + 100);

        storage.setWithExpire(o.key, o.value, futureTime);

        setTimeout(function() {
          assert(storage.getWithExpire(o.key) === undefined);
          // extra check to make sure it had been discarded
          assert(storage.keys().includes(o.key) === false);
          done();
        }, 300);
      });

      it('get a list of keys via localStorage', function() {
        storage.set(o.key, o.value);
        assert(storage.keys().includes(o.key) === true);
      });

      it('remove a pair of key/value via localStorage', function() {
        storage.set(o.key, o.value);
        storage.remove(o.key);
        assert(storage.get(o.key) === undefined);
      });

      it('remove all key/value via localStorage', function() {
        var oo = [{
          key: 'key1',
          valeu: 'value1'
        }, {
          key: 'key2',
          valeu: 'value2'
        }, {
          key: 'key3',
          valeu: 'value3'
        }];

        oo.forEach(function(item) {
          storage.set(item.key, item.value);
        });

        storage.removeAll();
        var allKeys = storage.keys();

        oo.forEach(function(item) {
          assert(allKeys.includes(item.key) === false);
        });
      });
    });

    describe('Test with cookie.(' + src + ')', function() {
      var context;
      var storage;

      beforeEach(function(done) {
        if (!context) {
          atomus()
            .html('')
            .external(src)
            .ready(function(err, window) {
              // force the storage to use cookie fallback
              window.localStorage.setItem = null;
              context = window;
              storage = window.mmle.storage;
              storage.init();
              done();
            });
        } else {
          done();
        }
      });

      afterEach(function() {
        var document = context.document;

        (document.cookie && document.cookie.split('; ') || [])
          .forEach(function(value) {
            var key = value.split('=')[0];
            document.cookie = key + '=null; expires=' + C.cookie.dead.toGMTString();
          });
      });

      it('set and get via cookie', function() {
        storage.set(o.key, o.value);
        assert.deepEqual(storage.get(o.key), o.value);
      });

      it('set the value with pre-defined prefix', function() {
        storage.set(o.key, o.value);
        assert(context.document.cookie.indexOf(C.prefix + o.key) > -1);
      });

      it('set and get via cookie if date is not expired', function(done) {
        var futureTime = new Date(new Date().getTime() + 60 * 1000);

        storage.setWithExpire(o.key, o.value, futureTime);

        setTimeout(function() {
          assert.deepEqual(storage.getWithExpire(o.key), o.value);
          done();
        }, 300);
      });

      it('set and get via cookie if date expired', function(done) {
        var futureTime = new Date(new Date().getTime() + 100);

        storage.setWithExpire(o.key, o.value, futureTime);

        setTimeout(function() {
          assert(storage.getWithExpire(o.key) === undefined);
          // extra check to make sure it had been discarded
          assert(storage.get(o.key) === undefined);
          done();
        }, 300);
      });

      it('get a list of keys via cookie', function() {
        storage.set(o.key, o.value);
        assert(storage.keys().includes(o.key));
      });

      it('remove a pair of key/value via cookie', function() {
        storage.set(o.key, o.value);
        storage.remove(o.key);
        assert(storage.get(o.key) === undefined);
      });

      it('remove all key/value via cookie', function() {
        var oo = [{
          key: 'key1',
          value: 'value1'
        }, {
          key: 'key2',
          value: 'value2'
        }, {
          key: 'key3',
          value: 'value3'
        }];

        oo.forEach(function(item) {
          storage.set(item.key, item.value);
        });

        storage.removeAll();
        var allKeys = storage.keys();

        oo.forEach(function(item) {
          assert(allKeys.includes(item.key) === false);
        });
      });
    });

  });
});
