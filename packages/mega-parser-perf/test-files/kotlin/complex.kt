data class Node<T>(var value: T, var next: Node<T>? = null)

class LinkedList<T> {
    private var head: Node<T>? = null

    fun insert(value: T) {
        val newNode = Node(value)
        if (head == null) {
            head = newNode
            return
        }

        var current = head
        while (current?.next != null) {
            current = current.next
        }
        current?.next = newNode
    }

    fun find(value: T): Node<T>? {
        var current = head
        while (current != null) {
            if (current.value == value) {
                return current
            }
            current = current.next
        }
        return null
    }

    fun delete(value: T): Boolean {
        if (head == null) return false

        if (head?.value == value) {
            head = head?.next
            return true
        }

        var current = head
        while (current?.next != null) {
            if (current.next?.value == value) {
                current.next = current.next?.next
                return true
            }
            current = current.next
        }
        return false
    }
}

fun main() {
    val list = LinkedList<Int>()
    list.insert(1)
    list.insert(2)
    list.insert(3)
    println(list.find(2))
    list.delete(2)
} 