package org.finos.vuu.spreadsheet.engine.parse;

/** The user's input is not a valid formula. The message is shown to the user. */
public class FormulaParseException extends RuntimeException {

    private final int position;

    public FormulaParseException(String message, int position) {
        super(message + " at position " + position);
        this.position = position;
    }

    /** Zero-based offset into the formula text, counting the leading '='. */
    public int position() {
        return position;
    }
}
