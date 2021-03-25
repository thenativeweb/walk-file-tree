import { error, Result, value } from 'defekt';
import * as errors from './errors';

class Queue<TItem> {
  protected items: TItem[];

  public constructor (...initialItems: TItem[]) {
    this.items = [ ...initialItems ];
  }

  public isEmpty (): boolean {
    return this.items.length === 0;
  }

  public push (...items: TItem[]): void {
    this.items = [ ...items, ...this.items ];
  }

  public pop (): Result<TItem, errors.QueueIsEmpty> {
    return this.isEmpty() ?
      error(new errors.QueueIsEmpty()) :
      value(this.items.pop()! as TItem);
  }
}

export {
  Queue
};
