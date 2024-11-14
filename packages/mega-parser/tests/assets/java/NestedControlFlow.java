public class NestedControlFlow {
    public void complexProcess(int x) {
        if (x > 0) { // +1
            for (int i = 0; i < x; i++) { // +1
                if (i % 2 == 0 && i != 0) { // +1 for 'if', +1 for '&&'
                    System.out.println(i);
                }
            }
        } else {
            while (x < 0) { // +1
                x++;
            }
        }
        String result = (x == 0) ? "Zero" : "Non-zero"; // +1
        System.out.println(result);
    }
}
