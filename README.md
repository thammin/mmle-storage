# mmle-storage

> Make My Life Easier when manipulate with `localStorage`

* fallback to `cookie` if `localStorage` is not available
* include unique prefix automatically to prevent conflict 
* support time expiration
* option to use [lz-string](https://github.com/pieroxy/lz-string) as data compressor

# Usage

#### Browser

```
└── dist
    ├── mmle-storage.js
    └── mmle-storage-compressor.js // included lz-string compressor
```

```js
var storage = mmle.storage;

var info = {
  location: 'Japan',
  timezone: '+9'
};

storage.set('userInfo', info)
  .then(function() {
    // save to storage succesfully
  });
    
storage.get('userInfo')
  .then(function(storedInfo) {
    console.log(storedInfo); // { location: 'Japan', timezone: '+9' }
  });
```

# API

#### `storage.set(key, value)`

Set `value` to the `key`.

```js
storage.set('someData', [1, 3, 5])
  .then(function() {
    // save to storage succesfully
  });
```

#### `storage.get(key)`

Get `value` from the `key`.

```js
storage.get('someData')
  .then(function(data) {
    console.log(data); // [1, 3, 5]
  });
```

#### `storage.setWithExpire(key, value, date)`
#### `storage.getWithExpire(key, value, date)`

Set/Get `value` to/from the `key` with a `Date` to be expired.

```js
var nextWeek = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);

storage.setWithExpire('checkin', true, nextWeek)
  .then(function() {
    // save to storage successfully
  });
  
// one day later
storage.getWithExpire('chekin')
  .then(function(data) {
    console.log(data); // true
  });
  
// one week later
storage.getWithExpire('chekin')
  .then(function(data) {
    console.log(data); // undefined
  });
```

#### `storage.remove(key)`

Remove `key` and `value` from the storage.

```js
storage.remove('someData')
  .then(function() {
    // remove key and value from the storage
  });
```

#### `storage.removeAll()`

Remove all `key` and `value` from the storage. This only remove data which prefixed uniquely.

```js
storage.removeAll()
  .then(function() {
    // remove all key and value from the storage
  });
```

# Test

```
npm test
```
