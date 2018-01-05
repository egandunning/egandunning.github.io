import java.util.Timer;
import java.util.TimerTask;

public class TimerTest {
  public static void main(String[] args) {
    System.out.println("Starting up...");
    
    //one-time use timer: prints stuff after 10s
    Timer myTimer = new Timer();
    myTimer.schedule(new TimerTask(){
        @Override
        public void run() {
          System.out.println("hello from timer");
        }
    }, 10000);
    
    //repeating timer: prints stuff every 10s
    Timer myRepeatingTimer = new Timer();
    myRepeatingTimer.scheduleAtFixedRate(new TimerTask(){
        @Override
        public void run(){
          System.out.println("hello from repeating timer");
        }
    }, 0, 1000);
  }
}