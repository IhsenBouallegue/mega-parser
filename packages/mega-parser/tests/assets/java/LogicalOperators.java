public class LogicalOperators {
    public void checkConditions(boolean a, boolean b) {
        if (a && b || !a) { // +1 for 'if', +1 for '&&', +1 for '||'
            System.out.println("Condition met");
        }
    }
}
