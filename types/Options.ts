import { FileTypes } from '../types/FileTypes';
import { MatcherFunction } from './MatcherFunction';

export interface Options {
  miles?: 500;
  directory: string;
  yields?: FileTypes[];
  matches?: MatcherFunction;
  excludes?: MatcherFunction;
  followsSymlinks?: boolean;
  maximumDepth?: number;
}
