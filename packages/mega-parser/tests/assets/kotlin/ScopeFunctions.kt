class ScopeFunctions {
    fun useScopeFunctions(str: String) {
        str.let { // +1
            it.length
        }.also { // +1
            println(it)
        }.run { // +1
            toString()
        }.apply { // +1
            println(this)
        }.let { str -> // +1 (last scope function)
            println(str)
        }
    }
} 