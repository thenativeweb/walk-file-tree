import { defekt } from 'defekt';

class QueueIsEmpty extends defekt({ code: 'QueueIsEmpty' }) {}
class RelativePathsAreUnsupported extends defekt({ code: 'RelativePathsAreUnsupported' }) {}

export {
  QueueIsEmpty,
  RelativePathsAreUnsupported
};
