export class LinkedList<T> {
  next: LinkedList<T> | null;
  head: LinkedList<T> | null;
  tail: LinkedList<T>;
  constructor(private data: T) {
    this.next = null;
    this.head = this;
    this.tail = this;
  }

  append(data: T) {
    this.tail.next = new LinkedList(data);
    this.tail = this.tail.next;
  }

  prepend(data: T) {
    const node = new LinkedList(data);
    node.next = this.head;
    this.head = node;
  }

  *values() {
    while (this.head !== null) {
      yield this.head.data;
      this.head = this.head.next;
    }
  }
}
