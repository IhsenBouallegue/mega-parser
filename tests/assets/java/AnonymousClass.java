public class AnonymousClass {
    public void createRunnable() {
        Runnable runnable = new Runnable() { // +1 for anonymous class
            @Override
            public void run() {
                if (true) { // +1
                    System.out.println("Running");
                }
            }
        };
        runnable.run();
    }
}
