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

// save to storage
storage.set('userInfo', info); 
    
var storedInfo = storage.get('userInfo');
console.log(storedInfo); // { location: 'Japan', timezone: '+9' }
```

# API

#### `storage.set(key, value)`

Set `value` to the `key`.

```js
// save to storage
storage.set('someData', [1, 3, 5]);
```

#### `storage.get(key)`

Get `value` from the `key`.

```js
var data = storage.get('someData')
console.log(data); // [1, 3, 5]
```

#### `storage.setWithExpire(key, value, date)`
#### `storage.getWithExpire(key, value, date)`

Set/Get `value` to/from the `key` with a `Date` to be expired.

```js
var nextWeek = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);

// save to storage
storage.setWithExpire('checkin', true, nextWeek); 
  
// one day later
storage.getWithExpire('chekin'); // true
  
// one week later
storage.getWithExpire('chekin'); // undefined
```

#### `storage.remove(key)`

Remove `key` and `value` from the storage.

```js
// remove key and value from the storage
storage.remove('someData');
```

#### `storage.removeAll()`

Remove all `key` and `value` from the storage. This only remove data which prefixed uniquely.

```js
// remove all key and value from the storage
storage.removeAll();
```

# Test

```
npm test
```
