import { EntryType } from './EntryType';
import { MatcherFunction } from './MatcherFunction';

export interface Options {
  miles?: 500;
  directory: string;
  yields?: EntryType[];
  matches?: MatcherFunction;
  ignores?: MatcherFunction;
  followsSymlinks?: boolean;
  maximumDepth?: number;
}
