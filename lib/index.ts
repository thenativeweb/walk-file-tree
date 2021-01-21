import { errors } from './errors';
import fsPromises from 'fs/promises';
import path from 'path';

type MatcherFunction = (pathName: string) => boolean;

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

interface DoWalkResult {
  pathName: string;
  visited: string[];
}

const alwaysTrue = function (): boolean {
  return true;
};

const alwaysFalse = function (): boolean {
  return false;
};

const resolveSymlink = async function (pathName: string): Promise<string> {
  const parentDirectory = path.resolve(pathName, '..');
  const linkTarget = await fsPromises.readlink(pathName);
  const resolvedPath = path.resolve(parentDirectory, linkTarget);

  return resolvedPath;
};

const setMerge = function (anArray: string[], anotherArray: string[]): string[] {
  const asSet = new Set([ ...anArray, ...anotherArray ]);

  return [ ...asSet ];
};

const doWalk = async function * ({
  directory,
  yields = 'filesAndDirectories',
  matches = alwaysTrue,
  excludes = alwaysFalse,
  followsSymlinks = false,
  depth = Number.POSITIVE_INFINITY,
  visited
}: DoWalkOptions): AsyncIterable<DoWalkResult> {
  const isDirectorySymlink = (await fsPromises.lstat(directory)).isSymbolicLink();
  const canonicalDirectory = isDirectorySymlink ? await resolveSymlink(directory) : directory;
  let visitedInThisScope = [ ...visited ];

  if (visited.includes(canonicalDirectory)) {
    return;
  }

  for await (const childName of await fsPromises.readdir(canonicalDirectory)) {
    const pathName = path.join(canonicalDirectory, childName);
    const statResult = await fsPromises.stat(pathName);
    const lstatResult = await fsPromises.lstat(pathName);
    const isSymbolicLink = lstatResult.isSymbolicLink();
    const isDirectory = statResult.isDirectory();
    const isFile = statResult.isFile();

    if (isSymbolicLink && !followsSymlinks) {
      continue;
    }

    console.log({
      pathName,
      visitedInThisScope
    });

    if (isDirectory && (depth > 0)) {
      for await (const doWalkResult of doWalk({
        directory: pathName,
        yields,
        matches,
        excludes,
        followsSymlinks,
        depth: depth - 1,
        visited: [ ...visitedInThisScope, canonicalDirectory ]
      })) {
        visitedInThisScope = setMerge(visitedInThisScope, doWalkResult.visited);

        yield {
          pathName: doWalkResult.pathName,
          visited: visitedInThisScope
        };
      }
    }

    if (yields === 'directories' && !isDirectory) {
      continue;
    }
    if (yields === 'files' && !isFile) {
      continue;
    }
    if (yields === 'filesAndDirectories' && !(isFile || isDirectory)) {
      continue;
    }

    if (excludes(pathName)) {
      continue;
    }
    if (!matches(pathName)) {
      continue;
    }

    yield {
      pathName: isSymbolicLink ? await resolveSymlink(pathName) : pathName,
      visited: visitedInThisScope
    };
  }
};

const walk = async function * (options: WalkOptions): AsyncIterable<string> {
  if (!path.isAbsolute(options.directory)) {
    throw new errors.RelativePathsAreUnsupported();
  }

  for await (const { pathName } of doWalk({ ...options, visited: []})) {
    yield pathName;
  }
};

export {
  walk
};
