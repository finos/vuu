/**
 * Entry point of the profiling build. The React probe's DevTools hook must
 * exist before react-dom is evaluated, so it is installed by the first
 * import, ahead of the app.
 */
import "./install-react-probe";
import "./main";
