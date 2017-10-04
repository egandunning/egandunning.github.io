package egandunning.bluemouse;

import android.util.Log;
import android.view.KeyEvent;

import java.util.HashMap;

/**
 * Created by dunning on 9/18/2017.
 */

public class KeyCodeTranslator {
    /**
     * Translate KeyCodes into characters that xdotool can understand
     * @param event
     * @return
     */
    public static String getXDoToolKey(KeyEvent event) {
        int keyCode = event.getKeyCode();
        switch(keyCode) {
            case KeyEvent.KEYCODE_DEL:
                return "BackSpace";
            case KeyEvent.KEYCODE_PERIOD:
                return "period";
            case KeyEvent.KEYCODE_SEMICOLON:
                return "semicolon";
            case KeyEvent.KEYCODE_MINUS:
                return "minus";
            case KeyEvent.KEYCODE_PLUS:
                return "plus";
            case KeyEvent.KEYCODE_COMMA:
                return "comma";
            case KeyEvent.KEYCODE_POUND:
                return "pound";
            case KeyEvent.KEYCODE_APOSTROPHE:
                return "apostrophe";
            case KeyEvent.KEYCODE_SLASH:
                return "slash";
            case KeyEvent.KEYCODE_BACKSLASH:
                return "backslash";
            case KeyEvent.KEYCODE_ENTER:
                return "Return";
            case KeyEvent.KEYCODE_SPACE:
                return "space";
            case KeyEvent.KEYCODE_CAPS_LOCK: //caps lock key breaks server
                Log.d("CAPS", "caps lock alert!!!");
                return "null";
            case KeyEvent.KEYCODE_SHIFT_LEFT:
                Log.d("CAPS", "caps lock alert!!!");
                return "null";
            default:
                return "" + (char)event.getUnicodeChar();
        }
    }
}
