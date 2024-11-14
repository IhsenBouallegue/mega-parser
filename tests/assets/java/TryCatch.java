public class TryCatch {
    public void readFile(String fileName) {
        try {
            // Attempt to read file
        } catch (IOException e) { // +1
            e.printStackTrace();
        }
    }
}
