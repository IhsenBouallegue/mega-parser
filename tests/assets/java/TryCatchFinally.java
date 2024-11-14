public class TryCatchFinally {
    public void writeFile(String fileName) {
        try {
            // Attempt to write to file
        } catch (IOException e) { // +1
            e.printStackTrace();
        } finally {
            // Close resources
        }
    }
}
