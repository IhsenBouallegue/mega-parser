public class MultipleMethods {
    public void methodOne() {
        if (true) { // +1
            System.out.println("Method One");
        }
    }

    public void methodTwo() {
        for (int i = 0; i < 5; i++) { // +1
            System.out.println("Method Two");
        }
    }

    public void methodThree() {
        System.out.println("Method Three");
    }
}
