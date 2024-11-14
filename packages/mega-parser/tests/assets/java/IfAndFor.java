public class IfAndFor {
    public void processNumbers(int[] numbers) {
        if (numbers != null) {
            for (int number : numbers) {
                System.out.println(number);
            }
        }
    }
}
