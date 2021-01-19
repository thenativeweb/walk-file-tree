import { errors } from './errors';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

type MatcherFunction = (fileInfo: FileInfo) => boolean;

interface FileInfo {
  pathName: string;
  stats: fs.Stats;
}

interface WalkOptions {
  miles?: 500;
  directory: string;
  yields?: 'directories' | 'files' | 'filesAndDirectories';
  matches?: MatcherFunction;
  excludes?: MatcherFunction;
  followsSymlinks?: boolean;
  depth?: number;
}

interface DoWalkOptions extends WalkOptions {
  visited: string[];
}

const alwaysTrue = function (): boolean {
  return true;
};

const alwaysFalse = function (): boolean {
  return false;
};

const shouldRecurse = async function (
  fileInfo: FileInfo,
  depth: number
): Promise<boolean> {
  if (!fileInfo.stats.isDirectory()) {
    return false;
  }
  if (depth < 0) {
    return false;
  }

  return true;
};

const doWalk = async function * ({
  directory,
  yields = 'filesAndDirectories',
  matches = alwaysTrue,
  excludes = alwaysFalse,
  followsSymlinks = false,
  depth = Number.POSITIVE_INFINITY,
  visited
}: DoWalkOptions): AsyncIterable<FileInfo> {
  let canonicalDirectory = directory;

  if ((await fsPromises.lstat(directory)).isSymbolicLink()) {
    canonicalDirectory = path.join('..', await fsPromises.readlink(directory));
  }

  for await (const childName of await fsPromises.readdir(directory)) {
    const childPath = path.join(directory, childName);
    const fileInfo = {
      pathName: childPath,
      stats: await fsPromises.stat(childPath)
    };

    const isSymbolicLink = (await fsPromises.lstat(fileInfo.pathName)).isSymbolicLink();

    if (isSymbolicLink) {
      const canonicalPath = path.resolve(directory, await fsPromises.readlink(fileInfo.pathName));

      if (!followsSymlinks) {
        continue;
      }

      if (visited.includes(canonicalPath)) {
        continue;
      }
    }

    if (await shouldRecurse(fileInfo, depth)) {
      yield * doWalk({
        directory: childPath,
        yields,
        matches,
        excludes,
        followsSymlinks,
        depth: depth - 1,
        visited: [ ...visited, canonicalDirectory ]
      });
    }

    if (yields === 'directories' && !fileInfo.stats.isDirectory()) {
      continue;
    }
    if (yields === 'files' && !fileInfo.stats.isFile()) {
      continue;
    }
    if (yields === 'filesAndDirectories' && !(fileInfo.stats.isFile() || fileInfo.stats.isDirectory())) {
      continue;
    }

    if (excludes(fileInfo)) {
      continue;
    }
    if (!matches(fileInfo)) {
      continue;
    }

    yield fileInfo;
  }
};

const walk = async function * (options: WalkOptions): AsyncIterable<FileInfo> {
  if (!path.isAbsolute(options.directory)) {
    throw new errors.RelativePathsAreUnsupported();
  }
  yield * doWalk({ ...options, visited: []});
};

export type {
  FileInfo
};

export {
  walk
};
