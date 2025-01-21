class LambdaExpression {
    fun processNumbers() {
        val numbers = listOf(1, 2, 3)
        numbers.forEach { num -> // +1 for lambda
            println(num)
        }
    }
} 