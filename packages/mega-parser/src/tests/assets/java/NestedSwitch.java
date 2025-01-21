public class NestedSwitch {
    public void complexSwitch(int x, int y) {
        switch (x) {
            case 1: // +1
                switch (y) {
                    case 1: // +1
                        System.out.println("x=1, y=1");
                        break;
                    case 2: // +1
                        System.out.println("x=1, y=2");
                        break;
                }
                break;
            case 2: // +1
                System.out.println("x=2");
                break;
            default:
                System.out.println("Default case");
        }
    }
}
