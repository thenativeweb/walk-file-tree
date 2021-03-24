import { assert } from 'assertthat';
import { EntryType } from '../../lib/types/EntryType';
import path from 'path';
import { walk } from '../../lib';

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
        yields: [ EntryType.files ]
      })
    );
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

    assert.that(files).is.containingAllOf(expectedFiles);
    assert.that(files.length).is.equalTo(expectedFiles.length);
  });

  test('yields all directories.', async (): Promise<void> => {
    const directories = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.directories ]
      })
    );
    const expectedDirectories = makePlatformIndependentPaths(
      testDirectory,
      [
        [ '.' ],
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

    assert.that(directories).is.containingAllOf(expectedDirectories);
    assert.that(directories.length).is.equalTo(expectedDirectories.length);
  });

  test('yields all files matching some function.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.files ],
        matches: (pathName): boolean => pathName.includes('flatDirectory')
      })
    );
    const expectedFiles = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'flatDirectory', 'file_1' ],
        [ 'flatDirectory', 'file_2' ]
      ]
    );

    assert.that(files).is.containingAllOf(expectedFiles);
    assert.that(files.length).is.equalTo(expectedFiles.length);
  });

  test('yields all files except ignored ones.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.files ],
        ignores: (pathName): boolean => pathName.includes('flatDirectory')
      })
    );
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

    assert.that(files).is.containingAllOf(expectedFiles);
    assert.that(files.length).is.equalTo(expectedFiles.length);
  });

  test('yields all files up to a certain depth.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.files ],
        maximumDepth: 2
      })
    );
    const expectedFiles = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'flatDirectory', 'file_1' ],
        [ 'flatDirectory', 'file_2' ],
        [ 'deepDirectory_depth_0', 'file_4' ],
        [ 'deepDirectory_depth_0', 'file_3' ],
        [ 'deepDirectory_depth_0', 'file_6' ],
        [ 'file_0' ]
      ]
    );

    assert.that(files).is.containingAllOf(expectedFiles);
    assert.that(files.length).is.equalTo(expectedFiles.length);
  });

  test('yields all files, even ones that are actually symbolic links or are behind symbolic links.', async (): Promise<void> => {
    const files = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.files ],
        followsSymlinks: true
      })
    );
    const expectedFiles = makePlatformIndependentPaths(
      testDirectory,
      [
        [ '..', 'symlinkTargets', 'file_10' ],
        [ '..', 'symlinkTargets', 'linkedDirectory', 'file_11' ],
        [ '..', 'symlinkTargets', 'linkedDirectory', 'externalNestedDirectory', 'file_12' ],
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

    assert.that(files).is.containingAllOf(expectedFiles);
    assert.that(files.length).is.equalTo(expectedFiles.length);
  });

  test('yields all directories matching some function.', async (): Promise<void> => {
    const directories = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.directories ],
        matches: (pathName): boolean => pathName.includes('deepDirectory')
      })
    );
    const expectedDirectories = makePlatformIndependentPaths(
      testDirectory,
      [
        [ 'deepDirectory_depth_0' ],
        [ 'deepDirectory_depth_0', 'depth_1' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'depth_4' ]
      ]
    );

    assert.that(directories).is.containingAllOf(expectedDirectories);
    assert.that(directories.length).is.equalTo(expectedDirectories.length);
  });

  test('yields all directories except ignored ones.', async (): Promise<void> => {
    const directories = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.directories ],
        ignores: (pathName): boolean => pathName.includes('symlinks')
      })
    );
    const expectedDirectories = makePlatformIndependentPaths(
      testDirectory,
      [
        [ '.' ],
        [ 'flatDirectory' ],
        [ 'deepDirectory_depth_0' ],
        [ 'deepDirectory_depth_0', 'depth_1' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'depth_4' ]
      ]
    );

    assert.that(directories).is.containingAllOf(expectedDirectories);
    assert.that(directories.length).is.equalTo(expectedDirectories.length);
  });

  test('yields all directories up to a certain depth.', async (): Promise<void> => {
    const directories = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.directories ],
        maximumDepth: 2
      })
    );
    const expectedDirectories = makePlatformIndependentPaths(
      testDirectory,
      [
        [ '.' ],
        [ 'symlinksDirectory' ],
        [ 'symlinksDirectory', 'hereBeSymlinkA' ],
        [ 'symlinksDirectory', 'hereBeSymlinkB' ],
        [ 'flatDirectory' ],
        [ 'deepDirectory_depth_0' ],
        [ 'deepDirectory_depth_0', 'depth_1' ]
      ]
    );

    assert.that(directories).is.containingAllOf(expectedDirectories);
    assert.that(directories.length).is.equalTo(expectedDirectories.length);
  });

  test('yields all directories, even when symlinks are involved.', async (): Promise<void> => {
    const directories = await collectAsyncIterable(
      walk({
        directory: testDirectory,
        yields: [ EntryType.directories ],
        followsSymlinks: true
      })
    );
    const expectedDirectories = makePlatformIndependentPaths(
      testDirectory,
      [
        [ '.' ],
        [ 'symlinksDirectory' ],
        [ 'symlinksDirectory', 'hereBeSymlinkA' ],
        [ 'symlinksDirectory', 'hereBeSymlinkB' ],
        [ '..', 'symlinkTargets', 'linkedDirectory' ],
        [ '..', 'symlinkTargets', 'linkedDirectory', 'externalNestedDirectory' ],
        [ 'flatDirectory' ],
        [ 'deepDirectory_depth_0' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2', 'depth_3', 'depth_4' ],
        [ 'deepDirectory_depth_0', 'depth_1', 'depth_2' ],
        [ 'deepDirectory_depth_0', 'depth_1' ]
      ]
    );

    assert.that(directories).is.containingAllOf(expectedDirectories);
    assert.that(directories.length).is.equalTo(expectedDirectories.length);
  });
});
