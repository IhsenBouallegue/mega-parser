import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class MultipleLambdas {
    public void processList() {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4);
        List<Integer> evenNumbers = numbers.stream()
            .filter(n -> n % 2 == 0) // +1
            .map(n -> n * 2) // +1
            .collect(Collectors.toList());
        evenNumbers.forEach(n -> System.out.println(n)); // +1
    }
}
