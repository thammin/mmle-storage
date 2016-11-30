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

      it('should set and get via localStorage', function(done) {
        storage.set(o.key, o.value)
          .then(function() {
            return storage.get(o.key);
          })
          .then(function(value) {
            assert.deepEqual(o.value, value);
          })
          .then(done)
          .catch(done);
      });

      it('should set the value with pre-defined prefix', function(done) {
        storage.set(o.key, o.value)
          .then(function() {
            assert(context.localStorage.getItem(C.prefix + o.key) != null);
          })
          .then(done)
          .catch(done);
      });

      it('set and get via localstorage if date is not expired', function(done) {
        var futureTime = new Date(new Date().getTime() + 60 * 1000);

        storage.setWithExpire(o.key, o.value, futureTime)

        setTimeout(function() {
          storage.getWithExpire(o.key)
            .then(function(value) {
              assert.deepEqual(value, o.value);
            })
            .then(done)
            .catch(done);
        }, 300);
      });

      it('set and get via localstorage if date expired', function(done) {
        var futureTime = new Date(new Date().getTime() + 100);

        storage.setWithExpire(o.key, o.value, futureTime)

        setTimeout(function() {
          storage.getWithExpire(o.key)
            .then(function(value) {
              assert(value === undefined);
              // extra check to make sure it had been discarded
              return storage.keys();
            })
            .then(function(keys) {
              assert(keys.includes(o.key) === false);
            })
            .then(done)
            .catch(done);
        }, 300);
      });

      it('get a list of keys via localStorage', function(done) {
        storage.set(o.key, o.value)
          .then(function() {
            return storage.keys();
          })
          .then(function(keys) {
            assert(keys.includes(o.key) === true);
          })
          .then(done)
          .catch(done);
      });

      it('remove a pair of key/value via localStorage', function(done) {
        storage.set(o.key, o.value)
          .then(function() {
            return storage.remove(o.key);
          })
          .then(function() {
            return storage.get(o.key);
          })
          .then(function(value) {
            assert(value === undefined);
          })
          .then(done)
          .catch(done);
      });

      it('remove all key/value via localStorage', function(done) {
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

        Promise.all(oo.map(function(item) {
          return storage.set(item.key, item.value);
        }))
          .then(function() {
            return storage.removeAll();
          })
          .then(function() {
            return storage.keys();
          })
          .then(function(keys) {
            oo.forEach(function(item) {
              assert(keys.includes(item.key) === false);
            });
          })
          .then(done)
          .catch(done);
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

      it('set and get via cookie', function(done) {
        storage.set(o.key, o.value)
          .then(function() {
            return storage.get(o.key);
          })
          .then(function(value) {
            assert.deepEqual(value, o.value);
          })
          .then(done)
          .catch(done);
      });

      it('set the value with pre-defined prefix', function(done) {
        storage.set(o.key, o.value)
          .then(function() {
            assert(context.document.cookie.indexOf(C.prefix + o.key) > -1);
          })
          .then(done)
          .catch(done);
      });

      it('set and get via cookie if date is not expired', function(done) {
        var futureTime = new Date(new Date().getTime() + 60 * 1000);

        storage.setWithExpire(o.key, o.value, futureTime);

        setTimeout(function() {
          storage.getWithExpire(o.key)
            .then(function(value) {
              assert.deepEqual(value, o.value);
            })
            .then(done)
            .catch(done);
        }, 300);
      });

      it('set and get via cookie if date expired', function(done) {
        var futureTime = new Date(new Date().getTime() + 100);

        storage.setWithExpire(o.key, o.value, futureTime);

        setTimeout(function() {
          storage.getWithExpire(o.key)
            .then(function(value) {
              assert(value === undefined);
              // extra check to make sure it had been discarded
              return storage.get(o.key);
            })
            .then(function(value) {
              assert(value === undefined);
            })
            .then(done)
            .catch(done);
        }, 300);
      });

      it('get a list of keys via cookie', function(done) {
        storage.set(o.key, o.value);
        storage.keys()
          .then(function(keys) {
            assert(keys.includes(o.key));
          })
          .then(done)
          .catch(done);
      });

      it('remove a pair of key/value via cookie', function(done) {
        storage.set(o.key, o.value)
          .then(function() {
            return storage.remove(o.key);
          })
          .then(function() {
            return storage.get(o.key);
          })
          .then(function(value) {
            assert(value === undefined);
          })
          .then(done)
          .catch(done);
      });

      it('remove all key/value via cookie', function(done) {
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

        Promise.all(oo.map(function(item) {
          return storage.set(item.key, item.value);
        }))
          .then(function() {
            return storage.removeAll();
          })
          .then(function() {
            return storage.keys();
          })
          .then(function(keys) {
            oo.forEach(function(item) {
              assert(keys.includes(item.key) === false);
            });
          })
          .then(done)
          .catch(done);
      });
    });

  });
});
