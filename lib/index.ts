import { FileTypes } from '../types/FileTypes';
import fs from 'fs/promises';
import { kaputt } from '@yeldirium/kaputt';
import nodePath from 'path';
import { Options } from '../types/Options';
import { Queue } from './queue';
import { resolveSymlink } from './resolveSymlink';
import { unpackOrCrash } from '@yeldirium/result';

class RelativePathsAreUnsupported extends kaputt('RelativePathsAreUnsupported') {}

const alwaysTrue = function (): boolean {
  return true;
};

const alwaysFalse = function (): boolean {
  return false;
};

const walk = async function * ({
  directory,
  yields = [ FileTypes.files, FileTypes.directories ],
  matches = alwaysTrue,
  excludes = alwaysFalse,
  followsSymlinks = false,
  maximumDepth = Number.POSITIVE_INFINITY
}: Options): AsyncIterable<string> {
  if (!nodePath.isAbsolute(directory)) {
    throw new RelativePathsAreUnsupported(undefined, { data: { directory }});
  }

  const paths = new Queue<{ path: string; depth: number }>(
    { path: directory, depth: 0 }
  );
  const visisitedPaths = new Set<string>();

  while (!paths.isEmpty()) {
    const { path, depth } = unpackOrCrash(paths.pop());

    if (depth > maximumDepth) {
      continue;
    }

    const lstatResult = await fs.lstat(path);
    const isSymbolicLink = lstatResult.isSymbolicLink();
    const realPath = isSymbolicLink ? await resolveSymlink(path) : path;

    if (visisitedPaths.has(realPath)) {
      continue;
    }

    const statResult = await fs.stat(realPath);
    const isDirectory = statResult.isDirectory();
    const isFile = statResult.isFile();

    if (isSymbolicLink && !followsSymlinks) {
      continue;
    }

    if (matches(realPath) && !excludes(realPath)) {
      if (isFile && yields.includes(FileTypes.files)) {
        yield realPath;
      }
      if (isDirectory && yields.includes(FileTypes.directories)) {
        yield realPath;
      }
    }

    if (isDirectory) {
      paths.push(
        ...(await fs.readdir(realPath)).map(
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

export {
  walk
};
