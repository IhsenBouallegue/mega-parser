import java.util.Arrays;
import java.util.List;

public class LambdaExpression {
    public void printNumbers() {
        List<Integer> numbers = Arrays.asList(1, 2, 3);
        numbers.forEach(n -> System.out.println(n)); // +1 for '->'
    }
}
