/*
 * Parser Rules
 */
grammar VuuCel;

formula
    :   numberLiteral
    |   Identifier
    |   '=' expression
    ;

expression
    :   primary                                     # PrimaryExpression
    |   Identifier arguments                                # FunctionCallExpression
    |   ('+' | '-') expression                              # UnarySignExpression
    |   expression ('*' | '/' | '%') expression                     # MulDivModExpression
    |   expression ('+' | '-') expression                       # AddSubExpression
    |   expression ('<=' | '>=' | '>' | '<') expression                 # CompareExpression
    |   expression ('=' | '<>') expression                      # EqualCompareExpression
    ;

primary
    :   '(' expression ')'                              # ParenExpression
    |   literal                                     # LiteralExpression
    |   Identifier                                  # IdentifierExpression
    ;

literal
    :   numberLiteral                                   # NumberLiteralRule
    |   booleanLiteral                                  # BooleanLiteralRule
    ;

numberLiteral
    :   IntegerLiteral
    |   FloatingPointLiteral
    ;

booleanLiteral
    :   TrueKeyword
    |   FalseKeyword
    ;

arguments
    :   '(' expressionList? ')'
    ;

expressionList
    :   expression (ListSeparator expression)*
    ;

/*
 * Lexer Rules
 */

AddOperator :   '+' ;
SubOperator :   '-' ;
MulOperator :   '*' ;
DivOperator :   '/' ;
PowOperator :   '^' ;
EqOperator  :   '=' ;
NeqOperator :   '<>' ;
LeOperator  :   '<=' ;
GeOperator  :   '>=' ;
LtOperator  :   '<' ;
GtOperator  :   '>' ;

ListSeparator : ',';
DecimalSeparator : ',';

TrueKeyword :   [Tt][Rr][Uu][Ee] ;
FalseKeyword    :   [Ff][Aa][Ll][Ss][Ee] ;

Identifier
    : Letter (Letter | Digit)*
    ;

fragment Letter
    :   [A-Z_a-z]
    ;

fragment Digit
    :   [0-9]
    ;

IntegerLiteral
    :   '0'
    |   [1-9] [0-9]*
    ;

FloatingPointLiteral
    :   [0-9]+ DecimalSeparator [0-9]* Exponent?
    |   DecimalSeparator [0-9]+ Exponent?
    |   [0-9]+ Exponent
    ;

fragment Exponent
    :   ('e' | 'E') ('+' | '-')? ('0'..'9')+
    ;

WhiteSpace
    :   [ \t]+ -> channel(HIDDEN)
    ;