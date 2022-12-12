grammar CalculatedColumn;

TRUE : 'true';
FALSE : 'false';
//AND : 'and';
//OR : 'or';
LT : '<';
GT : '>';
EQ : '=';
NEQ : '!=';
IN : 'in';
STARTS : 'starts';
PLUS : '+';
MULTIPLY : '*';
DIVIDE : '/';
SUBTRACT : '-';

ENDS : 'ends';
//PATHSEP : '/';
LBRACK : '[';
RBRACK : ']';
LPAREN : '(';
RPAREN : ')';

ABS : 'abs';
MIN : 'min';
MAX : 'max';
CONCATENATE : 'concatenate';
TEXT : 'text';
LEFT : 'left';
RIGHT : 'right';
LEN : 'len';

expression : EQ term EOF;

//operator : PLUS | MULTIPLY | DIVIDE | SUBTRACT;
operator : LT | GT | EQ | NEQ | IN | STARTS | ENDS | PLUS | MULTIPLY | DIVIDE | SUBTRACT;

term : atom  | //=foo, or =100
       atom operator atom | //=foo* 100, or =bid*price
       atom operator LBRACK atom (',' atom)* RBRACK | //=foo in [X, Y, Z]
       LPAREN atom operator atom RPAREN (operator term)? |
       LPAREN atom RPAREN (operator term)? |
       atom ( operator term)?;

function :
    ABS LPAREN arguments RPAREN |
    MIN LPAREN arguments RPAREN |
    MAX LPAREN arguments RPAREN |
    ABS LPAREN atom RPAREN |
    LEN LPAREN atom RPAREN |
    TEXT LPAREN arguments RPAREN |
    CONCATENATE LPAREN arguments RPAREN |
    LEFT LPAREN atom ',' INT RPAREN |
    RIGHT LPAREN atom ',' INT RPAREN |
;

atom : ID | INT | FLOAT | STRING | TRUE | FALSE | function;

arguments : atom (',' atom)*;

//operator : LT | GT | EQ | NEQ | IN | STARTS | ENDS | PLUS | MULTIPLY | DIVIDE | SUBTRACT;

STRING : '"'('a'..'z'|'A'..'Z'|'0'..'9'|'.'|'-')* '"';
ID : ('a'..'z'|'A'..'Z'|'_') ('a'..'z'|'A'..'Z'|'0'..'9')*;
INT : '0'..'9'+;
FLOAT : ('0'..'9')+ '.' ('0'..'9')*;
//STRING : '"'('a'..'z'|'A'..'Z'|'0'..'9'|'.'|'-')* '"';
//STRING
//   : '"' SUPPCHAR* '"'
//   ;
//
////this code allows us to support more exotica (unicode, but also rserved chars) in the filter box
////TODO: CJS Add example of unicode filtering to tests
//fragment
//SUPPCHAR
//    :   ~["\\\r\n]
//    |   ESC
//    ;
//
//fragment ESC
//   : '\\' (["\\/bfnrt] | UNICODE)
//   ;
//fragment UNICODE
//   : 'u' HEX HEX HEX HEX
//   ;
//fragment HEX
//   : [0-9a-fA-F]
//   ;

WS  :   [ \t\r\n]+ -> skip;