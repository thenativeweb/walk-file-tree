import { EntryType } from './types/EntryType';
import fs from 'fs';
import nodePath from 'path';
import { Options } from './types/Options';
import { Queue } from './queue';
import { resolveSymlink } from './resolveSymlink';
import * as errors from './errors';

const alwaysTrue = function (): boolean {
  return true;
};

const alwaysFalse = function (): boolean {
  return false;
};

const walk = async function * ({
  directory,
  yields = [ EntryType.files, EntryType.directories ],
  matches = alwaysTrue,
  ignores = alwaysFalse,
  followsSymlinks = false,
  maximumDepth = Number.POSITIVE_INFINITY
}: Options): AsyncIterable<string> {
  if (!nodePath.isAbsolute(directory)) {
    throw new errors.RelativePathsAreUnsupported({ data: { directory }});
  }

  const paths = new Queue<{ path: string; depth: number }>(
    { path: directory, depth: 0 }
  );
  const visisitedPaths = new Set<string>();

  while (!paths.isEmpty()) {
    const { path, depth } = paths.pop().unwrapOrThrow();

    if (depth > maximumDepth) {
      continue;
    }

    const lstatResult = await fs.promises.lstat(path);
    const isSymbolicLink = lstatResult.isSymbolicLink();
    const realPath = isSymbolicLink ? await resolveSymlink(path) : path;

    if (visisitedPaths.has(realPath)) {
      continue;
    }

    const statResult = await fs.promises.stat(realPath);
    const isDirectory = statResult.isDirectory();
    const isFile = statResult.isFile();

    if (isSymbolicLink && !followsSymlinks) {
      continue;
    }

    if (matches(realPath) && !ignores(realPath)) {
      if (isFile && yields.includes(EntryType.files)) {
        yield realPath;
      }
      if (isDirectory && yields.includes(EntryType.directories)) {
        yield realPath;
      }
    }

    if (isDirectory) {
      paths.push(
        ...(await fs.promises.readdir(realPath)).map(
          (child): { path: string; depth: number } => ({
            path: nodePath.join(realPath, child),
            depth: depth + 1
          })
        )
      );
    }

    visisitedPaths.add(realPath);
  }
};

export { walk, EntryType };
