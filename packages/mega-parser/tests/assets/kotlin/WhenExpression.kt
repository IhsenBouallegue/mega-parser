class WhenExpression {
    fun describe(obj: Any) {
        when (obj) { // +1 for when
            1 -> println("One") // +1 for branch
            "Hello" -> println("Greeting") // +1 for branch
            is String -> println("String type") // +1 for branch
            else -> println("Unknown") // +1 for branch
        }
    }
} 