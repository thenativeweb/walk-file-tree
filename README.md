# walk-file-tree

walk-file-tree recursively fetches paths to files and directories.

## Status

| Category         | Status                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Version          | [![npm](https://img.shields.io/npm/v/walk-file-tree)](https://www.npmjs.com/package/walk-file-tree)                                                      |
| Dependencies     | ![David](https://img.shields.io/david/thenativeweb/walk-file-tree)                                                                                   |
| Dev dependencies | ![David](https://img.shields.io/david/dev/thenativeweb/walk-file-tree)                                                                               |
| Build            | ![GitHub Actions](https://github.com/thenativeweb/walk-file-tree/workflows/Release/badge.svg?branch=main) |
| License          | ![GitHub](https://img.shields.io/github/license/thenativeweb/walk-file-tree)                                                                         |

## Installation

```shell
$ npm install walk-file-tree
```

## Quick Start

First you need to add a reference to walk-file-tree to your application:

```javascript
const { walk } = require('walk-file-tree');
```

If you use TypeScript, use the following code instead:

```typescript
import { walk } from 'walk-file-tree';
```

Then you can call the `walk` function to recursively fetch paths to all the entries within a given directory. Provide the absolute path to that directory using the `directory` option:

```javascript
for await (const entry of walk({ directory: '/some/directory' })) {
  // ...
}
```

### Specifying entry types

From time to time you might only be interested in files or directories. In these cases, you can additionally provide a list of entry types you are interested in. For that, use the `yields` option. E.g., to fetch only directories, use the following code:

```javascript
for await (const entry of walk({
  directory: '/some/directory',
  yields: [ 'directories' ]
})) {
  // ...
}
```

*Please note that if you are using TypeScript, you can specify values of the EntryType enumeration (this needs to be imported separately).*

### Matching or ignoring entries

If you are not interested in all entries, but e.g. only want to fetch `.png` files, provide the `matches` option. Alternatively (or additionally) there is the `ignores` option which is the opposite. In both cases, you have to provide a callback function that returns whether the appropriate entry should be included or excluded:

```javascript
for await (const entry of walk({
  directory: '/some/directory',
  matches (entry) {
    return entry.endsWith('.png');
  },
  ignores (entry) {
    return entry.startsWith('/tmp/');
  }
})) {
  // ...
}
```

*Please note that it's valid to provide both options, or just a single one.*

### Handling symbolic links

If you want to follow symbolic links, provide the `followsSymlinks` option and set it to `true`. The entries being returned are the resolved on-disk names, not the names of the symbolic links themselves:

```javascript
for await (const entry of walk({
  directory: '/some/directory',
  followsSymlinks: true
})) {
  // ...
}
```

*Please note that by default, symbolic links will not be followed.*

### Limiting the maximum depth

To limit the maximum recursion depth, set the `maximumDepth` option to the desired value. The minimum level is `1`, which only fetches the files and directory names within the given directory. In other words, setting `maximumDepth` to `1` disables any recursion:

```javascript
for await (const entry of walk({
  directory: '/some/directory',
  maximumDepth: 1
})) {
  // ...
}
```

## Running quality assurance

To run quality assurance for this module use [roboter](https://www.npmjs.com/package/roboter):

```shell
$ npx roboter
```
