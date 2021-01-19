import { assert } from 'assertthat';
import path from 'path';
import { FileInfo, walk } from '../../lib';

const collectAsyncIterable = async function<T> (iterable: AsyncIterable<T>): Promise<T[]> {
  const elements: T[] = [];

  for await (const nextElement of iterable) {
    elements.push(nextElement);
  }

  return elements;
};
const makePlatformIndependentPaths = function (
  rootDirectory: string,
  pathsAsPathSegments: string[][]
): string[] {
  return pathsAsPathSegments.
    map((pathSegments): string => path.join(rootDirectory, ...pathSegments));
};

suite('walk', (): void => {
  const testDirectory = path.join(__dirname, '..', 'shared', 'fixtures', 'testDirectory');

  test('yields all files.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: 'files'
      })
    );
    const filePaths = files.map((fileInfo: FileInfo): string => fileInfo.pathName);
    const expectedFiles = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'flatDirectory', 'file_1' ],
        [ 'flatDirectory', 'file_2' ],
        [ 'deepDirectory_depth_0', 'file_4' ],
        [ 'deepDirectory_depth_0', 'file_3' ],
        [ 'deepDirectory_depth_0', 'file_6' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'file_9' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'depth_4', 'file_5' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'file_8' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'file_7' ],
        [ 'file_0' ]
      ]
    );

    assert.that(files.length).is.equalTo(expectedFiles.length);
    assert.that(filePaths).is.containingAllOf(expectedFiles);
  });
  test('yields all directories.', async (): Promise<void> => {
    const directories = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: 'directories'
      })
    );
    const directoryPaths = directories.map((fileInfo: FileInfo): string => fileInfo.pathName);
    const expectedDirectories = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'symlinksDirectory' ],
        [ 'symlinksDirectory', 'hereBeSymlinkA' ],
        [ 'symlinksDirectory', 'hereBeSymlinkB' ],
        [ 'flatDirectory' ],
        [ 'deepDirectory_depth_0' ],
        [ 'deepDirectory_depth_0', 'depth_1' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'depth_4' ]
      ]
    );

    assert.that(directories.length).is.equalTo(expectedDirectories.length);
    assert.that(directoryPaths).is.containingAllOf(expectedDirectories);
  });
  test('yields all files matching some function.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: 'files',
        matches: ({ pathName }): boolean => pathName.includes('flatDirectory')
      })
    );
    const filePaths = files.map(({ pathName }): string => pathName);
    const expectedFiles = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'flatDirectory', 'file_1' ],
        [ 'flatDirectory', 'file_2' ]
      ]
    );

    assert.that(files.length).is.equalTo(expectedFiles.length);
    assert.that(filePaths).is.containingAllOf(expectedFiles);
  });
  test('yields all files except excluded ones.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: 'files',
        excludes: ({ pathName }): boolean => pathName.includes('flatDirectory')
      })
    );
    const filePaths = files.map(({ pathName }): string => pathName);
    const expectedFiles = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'deepDirectory_depth_0', 'file_4' ],
        [ 'deepDirectory_depth_0', 'file_3' ],
        [ 'deepDirectory_depth_0', 'file_6' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'file_9' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'depth_4', 'file_5' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'file_8' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'file_7' ],
        [ 'file_0' ]
      ]
    );

    assert.that(files.length).is.equalTo(expectedFiles.length);
    assert.that(filePaths).is.containingAllOf(expectedFiles);
  });
  test('yields all files up to a certain depth.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: 'files',
        depth: 2
      })
    );
    const filePaths = files.map(({ pathName }): string => pathName);
    const expectedFiles = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'flatDirectory', 'file_1' ],
        [ 'flatDirectory', 'file_2' ],
        [ 'deepDirectory_depth_0', 'file_4' ],
        [ 'deepDirectory_depth_0', 'file_3' ],
        [ 'deepDirectory_depth_0', 'file_6' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'file_8' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'file_7' ],
        [ 'file_0' ]
      ]
    );

    assert.that(files.length).is.equalTo(expectedFiles.length);
    assert.that(filePaths).is.containingAllOf(expectedFiles);
  });
  test('yields all files, even ones that are actually symbolic links.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: 'files',
        followsSymlinks: true,
        depth: 10
      })
    );
    const filePaths = files.map(({ pathName }): string => pathName);
    const expectedFiles = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'symlinksDirectory', 'goto_file_10' ],
        [ 'flatDirectory', 'file_1' ],
        [ 'flatDirectory', 'file_2' ],
        [ 'deepDirectory_depth_0', 'file_4' ],
        [ 'deepDirectory_depth_0', 'file_3' ],
        [ 'deepDirectory_depth_0', 'file_6' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'file_9' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'depth_4', 'file_5' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'file_8' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'file_7' ],
        [ 'file_0' ]
      ]
    );

    assert.that(files.length).is.equalTo(expectedFiles.length);
    assert.that(filePaths).is.containingAllOf(expectedFiles);
  });
});
