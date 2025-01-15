interface TestNode<T> {
  value: T;
  next: TestNode<T> | null;
}

class LinkedList<T> {
  private head: TestNode<T> | null = null;

  insert(value: T): void {
    const newNode: TestNode<T> = { value, next: null };
    if (!this.head) {
      this.head = newNode;
      return;
    }

    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = newNode;
  }

  find(value: T): TestNode<T> | null {
    let current = this.head;
    while (current) {
      if (current.value === value) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  delete(value: T): boolean {
    if (!this.head) return false;

    if (this.head.value === value) {
      this.head = this.head.next;
      return true;
    }

    let current = this.head;
    while (current.next) {
      if (current.next.value === value) {
        current.next = current.next.next;
        return true;
      }
      current = current.next;
    }
    return false;
  }
}

const list = new LinkedList<number>();
list.insert(1);
list.insert(2);
list.insert(3);
console.log(list.find(2));
list.delete(2);
