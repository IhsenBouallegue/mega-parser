public class FunctionDetection {
    // Regular method
    public void regularMethod() {
        System.out.println("test");
    }

    // Method with parameters and return type
    private int complexMethod(int a, String b) {
        return a + b.length();
    }

    // Constructor
    public FunctionDetection(int value) {
        System.out.println(value);
    }

    // Method declaration (should not be counted)
    public void declarationOnly();

    // Method in string (should not be counted)
    String str = "public void test() { }";

    // Commented method (should not be counted)
    // public void commentedMethod() { }
} 