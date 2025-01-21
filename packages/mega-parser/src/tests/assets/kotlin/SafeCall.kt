class SafeCall {
    fun printLength(str: String?) {
        str?.length?.let { // +1 for safe call
            println(it)
        }
    }
} 