// Regular function
fun regularFunction() {
    println("test")
}

// Function with parameters and return type
fun complexFunction(a: Int, b: String): Int {
    return a + b.length
}

// Generic function
fun <T> genericFunction(item: T) {
    println(item)
}

// Function declaration (should not be counted)
fun declarationOnly()

// Function in string (should not be counted)
val str = "fun test() { }"

// Commented function (should not be counted)
// fun commentedFunction() { }

// Class with method
class TestClass {
    fun method() {
        println("test")
    }
} 