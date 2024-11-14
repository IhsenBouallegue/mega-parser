public class SwitchCases {
    public void printDay(int day) {
        switch (day) {
            case 1: // +1
                System.out.println("Monday");
                break;
            case 2: // +1
                System.out.println("Tuesday");
                break;
            case 3: // +1
                System.out.println("Wednesday");
                break;
            default:
                System.out.println("Another day");
        }
    }
}
