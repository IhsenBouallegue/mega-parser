class MultipleControlFlow {
    fun complexProcess(x: Int) {
        if (x > 0) { // +1
            for (i in 0..x) { // +1
                when (i % 2) { // +1
                    0 -> continue // +1
                    else -> println(i) // +1
                }
            }
        } else {
            println("Non-positive") // +1 for else
        }
    }
} 