import fs from 'fs/promises';
import path from 'path';

const resolveSymlink = async function (pathName: string): Promise<string> {
  const parentDirectory = path.resolve(pathName, '..');
  const linkTarget = await fs.readlink(pathName);
  const resolvedPath = path.resolve(parentDirectory, linkTarget);

  return resolvedPath;
};

export {
  resolveSymlink
};
