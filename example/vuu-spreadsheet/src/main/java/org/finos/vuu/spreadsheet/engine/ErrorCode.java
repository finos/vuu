package org.finos.vuu.spreadsheet.engine;

public enum ErrorCode {
    DIV0("#DIV/0!"),
    VALUE("#VALUE!"),
    REF("#REF!"),
    NAME("#NAME?"),
    NA("#N/A"),
    NUM("#NUM!");

    private final String display;

    ErrorCode(String display) {
        this.display = display;
    }

    public String display() {
        return display;
    }
}
