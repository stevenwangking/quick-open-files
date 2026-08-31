import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile, symlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { bookmarkEntries, currentDirOf, dirEntries, expandHome } from './filesList';

let fixture: string;

beforeEach(async () => {
  fixture = await mkdtemp(join(tmpdir(), 'qof-test-'));
  await mkdir(join(fixture, 'b-dir'));
  await mkdir(join(fixture, 'a-dir'));
  await writeFile(join(fixture, 'z.txt'), 'z');
  await writeFile(join(fixture, 'a.txt'), 'a');
  await writeFile(join(fixture, '.git'), 'git'); // regular file here; pattern still applies
  await writeFile(join(fixture, 'skip.pyc'), 'pyc');
  await writeFile(join(fixture, 'b-dir', 'inner.txt'), 'i');
});

afterEach(async () => {
  await rm(fixture, { recursive: true, force: true });
});

describe('expandHome', () => {
  it('expands ~ to the home directory', () => {
    expect(expandHome('~')).toBe(homedir());
    expect(expandHome('~/notes/todo.txt')).toBe(join(homedir(), 'notes/todo.txt'));
  });

  it('leaves other paths untouched', () => {
    expect(expandHome('/usr/local')).toBe('/usr/local');
    expect(expandHome('relative/path')).toBe('relative/path');
  });
});

describe('currentDirOf', () => {
  it("returns the active file document's folder", () => {
    expect(currentDirOf({ scheme: 'file', fsPath: '/tmp/x/y.txt' })).toBe('/tmp/x');
  });
  it('returns undefined when no file is open', () => {
    expect(currentDirOf(undefined)).toBeUndefined();
  });
  it('returns undefined for non-file documents', () => {
    expect(currentDirOf({ scheme: 'untitled', fsPath: 'Untitled-1' })).toBeUndefined();
    expect(currentDirOf({ scheme: 'output', fsPath: '/output' })).toBeUndefined();
  });
});

describe('bookmarkEntries', () => {
  it('expands and resolves existing bookmarks', async () => {
    const [entry] = await bookmarkEntries([fixture]);
    expect(entry.exists).toBe(true);
    expect(entry.isDir).toBe(true);
    expect(entry.path).toBe(fixture);
  });

  it('flags missing bookmarks without throwing', async () => {
    const [entry] = await bookmarkEntries(['/definitely/missing/path']);
    expect(entry.exists).toBe(false);
    expect(entry.isDir).toBe(false);
  });
});

describe('dirEntries', () => {
  const all = { folderExcludePatterns: [], fileExcludePatterns: [] };

  it('lists entries with .. first and trailing slash on folders', async () => {
    const entries = await dirEntries(fixture, all, false);
    expect(entries[0]).toMatchObject({ label: '../', isDir: true });
    const labels = entries.slice(1).map((e) => e.label);
    expect(labels).toContain('a-dir/');
    expect(labels).toContain('a.txt');
  });

  it('sorts folders before files when listDirsFirst is set', async () => {
    const entries = await dirEntries(fixture, all, true);
    const body = entries.slice(1); // drop ..
    expect(body.filter((e) => e.isDir).map((e) => e.label)).toEqual(['a-dir/', 'b-dir/']);
    expect(body.filter((e) => !e.isDir).map((e) => e.label)).toEqual(['.git', 'a.txt', 'skip.pyc', 'z.txt']);
  });

  it('sorts alphabetically within groups only', async () => {
    const entries = await dirEntries(fixture, all, true);
    const body = entries.slice(1).map((e) => e.label);
    expect(body).toEqual(['a-dir/', 'b-dir/', '.git', 'a.txt', 'skip.pyc', 'z.txt']);
  });

  it('applies file and folder exclude patterns', async () => {
    const exclude = { folderExcludePatterns: ['b-*'], fileExcludePatterns: ['*.pyc', '.git'] };
    const labels = (await dirEntries(fixture, exclude, false)).map((e) => e.label);
    expect(labels).not.toContain('b-dir/');
    expect(labels).not.toContain('skip.pyc');
    expect(labels).not.toContain('.git');
    expect(labels).toContain('a-dir/');
    expect(labels).toContain('a.txt');
  });

  it('applies files.exclude-style patterns with ** segments', async () => {
    await mkdir(join(fixture, 'node_modules'));
    const exclude = { folderExcludePatterns: ['**/node_modules/**'], fileExcludePatterns: ['**/*.pyc'] };
    const labels = (await dirEntries(fixture, exclude, false)).map((e) => e.label);
    expect(labels).not.toContain('node_modules/');
    expect(labels).not.toContain('skip.pyc');
    expect(labels).toContain('a-dir/');
    expect(labels).toContain('a.txt');
  });

  it('omits .. at the filesystem root', async () => {
    const entries = await dirEntries('/', all, false);
    expect(entries[0].label).not.toBe('../');
  });

  it('treats symlinks to folders as folders', async () => {
    await symlink(join(fixture, 'b-dir'), join(fixture, 'link-dir'));
    const entries = await dirEntries(fixture, all, false);
    const link = entries.find((e) => e.label === 'link-dir/');
    expect(link?.isDir).toBe(true);
  });

  it('rejects unreadable directories with an error', async () => {
    await expect(dirEntries(join(fixture, 'does-not-exist'), all, false)).rejects.toThrow();
  });
});
