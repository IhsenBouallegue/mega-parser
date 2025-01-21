class ObjectExpression {
    fun createListener() {
        val listener = object : Runnable { // +1 for object expression
            override fun run() { // +1 for method
                if (true) { // +1 for if
                    println("Running")
                }
            }
        }
    }
} 