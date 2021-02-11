import { kaputt } from '@yeldirium/kaputt';
import { fail, okay, Result } from '@yeldirium/result';

class QueueIsEmpty extends kaputt('QueueIsEmpty') {}

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

  public pop (): Result<TItem, QueueIsEmpty> {
    return this.isEmpty() ?
      fail(new QueueIsEmpty()) :
      okay(this.items.pop()!);
  }
}

export {
  Queue
};
