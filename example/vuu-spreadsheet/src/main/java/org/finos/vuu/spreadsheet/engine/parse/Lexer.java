package org.finos.vuu.spreadsheet.engine.parse;

import java.util.ArrayList;
import java.util.List;

/** Splits formula text (without the leading '=') into tokens. */
final class Lexer {

    private final String text;
    /** Offset of {@code text} within what the user typed, so error positions line up with the '='. */
    private final int offset;
    private int pos;

    Lexer(String text, int offset) {
        this.text = text;
        this.offset = offset;
    }

    List<Token> tokenize() {
        List<Token> tokens = new ArrayList<>();
        while (true) {
            skipWhitespace();
            if (pos >= text.length()) {
                tokens.add(new Token(Token.Type.EOF, "", offset + pos));
                return tokens;
            }
            tokens.add(next());
        }
    }

    private void skipWhitespace() {
        while (pos < text.length() && Character.isWhitespace(text.charAt(pos))) pos++;
    }

    private Token next() {
        int start = pos;
        char c = text.charAt(pos);
        if (Character.isDigit(c) || (c == '.' && pos + 1 < text.length() && Character.isDigit(text.charAt(pos + 1)))) {
            return number();
        }
        if (c == '"') return string();
        if (Character.isLetter(c) || c == '$' || c == '_') return ident();
        pos++;
        return switch (c) {
            case '+' -> token(Token.Type.PLUS, start);
            case '-' -> token(Token.Type.MINUS, start);
            case '*' -> token(Token.Type.STAR, start);
            case '/' -> token(Token.Type.SLASH, start);
            case '^' -> token(Token.Type.CARET, start);
            case '&' -> token(Token.Type.AMPERSAND, start);
            case '%' -> token(Token.Type.PERCENT, start);
            case '=' -> token(Token.Type.EQ, start);
            case '(' -> token(Token.Type.LPAREN, start);
            case ')' -> token(Token.Type.RPAREN, start);
            case ',' -> token(Token.Type.COMMA, start);
            case ':' -> token(Token.Type.COLON, start);
            case '<' -> {
                if (match('=')) yield token(Token.Type.LE, start);
                if (match('>')) yield token(Token.Type.NE, start);
                yield token(Token.Type.LT, start);
            }
            case '>' -> match('=') ? token(Token.Type.GE, start) : token(Token.Type.GT, start);
            default -> throw new FormulaParseException("Unexpected character '" + c + "'", offset + start);
        };
    }

    private boolean match(char expected) {
        if (pos < text.length() && text.charAt(pos) == expected) {
            pos++;
            return true;
        }
        return false;
    }

    private Token token(Token.Type type, int start) {
        return new Token(type, text.substring(start, pos), offset + start);
    }

    private Token number() {
        int start = pos;
        while (pos < text.length() && Character.isDigit(text.charAt(pos))) pos++;
        if (pos < text.length() && text.charAt(pos) == '.') {
            pos++;
            while (pos < text.length() && Character.isDigit(text.charAt(pos))) pos++;
        }
        if (pos < text.length() && (text.charAt(pos) == 'e' || text.charAt(pos) == 'E')) {
            int save = pos;
            pos++;
            if (pos < text.length() && (text.charAt(pos) == '+' || text.charAt(pos) == '-')) pos++;
            if (pos < text.length() && Character.isDigit(text.charAt(pos))) {
                while (pos < text.length() && Character.isDigit(text.charAt(pos))) pos++;
            } else {
                pos = save;
            }
        }
        return token(Token.Type.NUMBER, start);
    }

    private Token string() {
        int start = pos;
        pos++; // opening quote
        StringBuilder sb = new StringBuilder();
        while (pos < text.length()) {
            char c = text.charAt(pos++);
            if (c == '"') {
                if (pos < text.length() && text.charAt(pos) == '"') {
                    sb.append('"');
                    pos++;
                } else {
                    return new Token(Token.Type.STRING, sb.toString(), offset + start);
                }
            } else {
                sb.append(c);
            }
        }
        throw new FormulaParseException("Unterminated string", offset + start);
    }

    private Token ident() {
        int start = pos;
        while (pos < text.length()) {
            char c = text.charAt(pos);
            if (Character.isLetterOrDigit(c) || c == '$' || c == '_' || c == '.') pos++;
            else break;
        }
        return token(Token.Type.IDENT, start);
    }
}
