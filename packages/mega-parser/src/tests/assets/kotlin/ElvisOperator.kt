class ElvisOperator {
    fun getLength(str: String?) {
        val length = str?.length ?: 0 // +1 for elvis operator
        println(length)
    }
} 