package org.finos.vuu.spreadsheet.engine;

/** The computed value of a cell. */
public sealed interface CellValue {

    CellValue EMPTY = new EmptyValue();

    static CellValue number(double value) {
        return Double.isFinite(value) ? new NumberValue(value) : new ErrorValue(ErrorCode.NUM);
    }

    static CellValue text(String value) {
        return new TextValue(value);
    }

    static CellValue bool(boolean value) {
        return new BoolValue(value);
    }

    static CellValue error(ErrorCode code) {
        return new ErrorValue(code);
    }

    /** Name used for the {@code valueType} column. */
    String typeName();

    record NumberValue(double value) implements CellValue {
        @Override public String typeName() { return "NUMBER"; }
    }

    record TextValue(String value) implements CellValue {
        @Override public String typeName() { return "TEXT"; }
    }

    record BoolValue(boolean value) implements CellValue {
        @Override public String typeName() { return "BOOL"; }
    }

    record ErrorValue(ErrorCode code) implements CellValue {
        @Override public String typeName() { return "ERROR"; }
    }

    record EmptyValue() implements CellValue {
        @Override public String typeName() { return "EMPTY"; }
    }
}
