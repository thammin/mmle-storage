(function() {
  'use strict';
  var root = this;

  /**
   * Make my life easier
   * get/set value from/to localStorage, fallback to cookie if localStorage is not supported.
   * option to use lz-string as encoder/decoder.
   *
   * @param {*} obj The object to manipulate with.
   * @param {String} path The path of the property to get/set.
   * @param {*} [val=undefined] The value to set.
   * @param {Boolean} [allowOverwrite] Specify allowing overwrite when value is already existed.
   * @returns {*} returns value if we got any value.
   */
  var storage = {
    init: init,
    keys: keys,
    set: set,
    get: get,
    setWithExpire: setWithExpire,
    getWithExpire: getWithExpire,
    remove: remove,
    removeAll: removeAll
  };

  // constants
  var C = {
    prefix: 'mmle-storage__',
    cookie: {
      dead: new Date('1970/01/01 00:00:00'),
      undead: new Date('9999/12/31 23:59:59'),
      path: '/'
    }
  };
  // caches
  var c = {
    storageType: '',
    cookie: {
      encoder: through,
      decoder: through
    },
    localStorage: {
      encoder: through,
      decoder: through
    }
  };
  init();

  function init() {
    // check available storage type
    try {
      var key = C.prefix + '__' + Math.round(Math.random() * 1e7);
      root.localStorage.setItem(key, '');
      root.localStorage.removeItem(key);
      c.storageType = 'localStorage';
    } catch (e) {
      c.storageType = 'cookie';
    }

    // check LZString
    if (root.LZString) {
      c.cookie.encoder = root.LZString.compressToEncodedURIComponent;
      c.cookie.decoder = root.LZString.decompressFromEncodedURIComponent;
      c.localStorage.encoder = root.LZString.compressToUTF16;
      c.localStorage.decoder = root.LZString.decompressFromUTF16;
    }
  };

  /**
   * list all the keys of storage
   * @returns {Array}
   */
  function keys() {
    var storedKeys = [];

    if (c.storageType === 'cookie') {
      storedKeys = (document.cookie && document.cookie.split('; ') || [])
        .map(function(value) {
          return value.split('=')[0];
        })
        .map(function(key) {
          return key.replace(C.prefix, '');
        });
    } else {
      storedKeys = Object.keys(root.localStorage)
        .filter(function(key) {
          return key.indexOf(C.prefix) === 0;
        })
        .map(function(key) {
          return key.replace(C.prefix, '');
        });
    }

    return Promise.resolve(storedKeys);
  }

  /**
   * base method to set value to a key
   *
   * @param {String} key
   * @param {*} value
   * @param {Date} expireDate
   * @private
   */
  function baseSet(key, value, expireDate) {
    if (!key) {
      return Promise.reject(new Error('Invalid arguments.'));
    }

    var _key = C.prefix + key;
    var _value = JSON.stringify(value);

    if (c.storageType === 'cookie') {
      var expiry = '; expires=' + (expireDate || C.cookie.undead).toGMTString();
      var path = '; path=' + C.cookie.path;
      document.cookie = _key + '=' + c[c.storageType].encoder(_value) + expiry + path;
    } else {
      root.localStorage.setItem(_key, c[c.storageType].encoder(_value));
    }

    return Promise.resolve();
  }

  /**
   * set value to a key
   *
   * @param {String} key
   * @param {*} value
   */
  function set(key, value) {
    return baseSet(key, value);
  }

  /**
   * set value to a key with expire date
   * value will be discard if next time we try to get it after the expire date
   *
   * @param {String} key
   * @param {*} value
   * @param {Date} expireDate
   */
  function setWithExpire(key, value, expireDate) {
    var wrappedValue = {
      expireDate: expireDate.getTime(),
      value: value
    };

    return baseSet(key, wrappedValue, expireDate);
  }

  /**
   * get value from a key
   *
   * @param {String} key
   * @returns {*}
   */
  function get(key) {
    if (!key) {
      return Promise.reject();
    }

    var _key = C.prefix + key;

    if (c.storageType === 'cookie') {
      var cookieStorage = {};
      (document.cookie && document.cookie.split('; ') || [])
        .forEach(function(value) {
          var split = value.split('=');
          cookieStorage[split[0]] = split[1];
        });

      var _value = cookieStorage[_key];
      if (_value) {
        return tryParse(c[c.storageType].decoder(_value));
      } else {
        return Promise.resolve(_value);
      }
    } else {
      var _value = root.localStorage.getItem(_key);
      if (_value) {
        return tryParse(c[c.storageType].decoder(_value));
      } else {
        return Promise.resolve(_value);
      }
    }
  }

  /**
   * get value of a key if the date is not expired
   *
   * @param {String} key
   * @returns {*}
   */
  function getWithExpire(key) {
    return get(key)
      .then(function(wrappedValue) {
        if (wrappedValue) {
          if (new Date().getTime() > wrappedValue.expireDate) {
            return remove(key);
          } else {
            return wrappedValue.value;
          }
        } else {
          return Promise.resolve();
        }
      });
  }

  /**
   * remove a pair of key and value
   *
   * @param {String} key
   */
  function remove(key) {
    if (!key) {
      return Promise.reject();
    }

    var _key = C.prefix + key;

    if (c.storageType === 'cookie') {
      var cookieStorage = {};
      (document.cookie && document.cookie.split('; ') || [])
        .forEach(function(value) {
          var split = value.split('=');
          cookieStorage[split[0]] = split[1];
        });

      if (cookieStorage.hasOwnProperty(_key)) {
        return baseSet(key, undefined, C.cookie.dead);
      } else {
        return Promise.resolve();
      }
    } else {
      root.localStorage.removeItem(_key);
      return Promise.resolve();
    }
  }

  /**
   * remove all keys and values
   */
  function removeAll() {
    // TODO: should execute by one operation for performance
    return keys()
      .then(function(keys) {
        return Promise.all(keys.map(remove));
      });
  }

  /**
   * helper to try parse value
   * return original value if failed
   *
   * @param {String} value
   * @returns {Object|String}
   */
  function tryParse(value) {
    try {
      return Promise.resolve(JSON.parse(value));
    } catch (e) {
      return Promise.resolve(value);
    }
  }

  /**
   * helper to pass through the first arguments
   * @param {*} content
   * @returns {*} content
   */
  function through(content) {
    return content;
  }

  // exports to global
  (function _exports(_moduleName, _module) {
    root.mmle = root.mmle || {};
    root.mmle[_moduleName] = _module;
  })('storage', storage);

}).call(this);
