public class MultipleControlFlow {
    public void complexMethod(int x) {
        if (x > 0) { // +1
            for (int i = 0; i < x; i++) { // +1
                while (i < x / 2) { // +1
                    i++;
                }
            }
        }
        switch (x) {
            case 1: // +1
                System.out.println("One");
                break;
            case 2: // +1
                System.out.println("Two");
                break;
            default:
                System.out.println("Other");
        }
    }
}
