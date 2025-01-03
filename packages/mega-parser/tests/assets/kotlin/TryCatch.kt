class TryCatch {
    fun processFile() {
        try {
            // Some file operation
        } catch (e: Exception) { // +1
            e.printStackTrace()
        }
    }
} 