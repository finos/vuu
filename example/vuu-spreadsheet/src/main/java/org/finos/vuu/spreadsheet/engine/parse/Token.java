package org.finos.vuu.spreadsheet.engine.parse;

record Token(Type type, String text, int position) {

    enum Type {
        NUMBER, STRING, IDENT,
        PLUS, MINUS, STAR, SLASH, CARET, AMPERSAND, PERCENT,
        EQ, NE, LT, GT, LE, GE,
        LPAREN, RPAREN, COMMA, COLON,
        EOF
    }
}
