grammar Filter;

TRUE : 'true';
FALSE : 'false';
AND : 'and';
OR : 'or';
LT : '<';
GT : '>';
EQ : '=';
NEQ : '!=';
IN : 'in';
STARTS : 'starts';
ENDS : 'ends';
//PATHSEP : '/';
LBRACK : '[';
RBRACK : ']';
LPAREN : '(';
RPAREN : ')';

expression : or_expression EOF;

or_expression : and_expression (OR or_expression)*;

and_expression : term (AND term)*;

term : atom ( operator atom)? | LPAREN or_expression RPAREN | atom operator LBRACK atom (',' atom)* RBRACK ;

atom : ID | INT | FLOAT | STRING | TRUE | FALSE;

operator : LT | GT | EQ | NEQ | IN | STARTS | ENDS;

INT : '0'..'9'+;
FLOAT : ('0'..'9')+ '.' ('0'..'9')*;
//STRING : '"'('a'..'z'|'A'..'Z'|'0'..'9'|'.'|'-')* '"';
STRING
   : '"' SUPPCHAR* '"'
   ;

//this code allows us to support more exotica (unicode, but also rserved chars) in the filter box
//TODO: CJS Add example of unicode filtering to tests
fragment
SUPPCHAR
    :   ~["\\\r\n]
    |   ESC
    ;

fragment ESC
   : '\\' (["\\/bfnrt] | UNICODE)
   ;
fragment UNICODE
   : 'u' HEX HEX HEX HEX
   ;
fragment HEX
   : [0-9a-fA-F]
   ;

ID : ('a'..'z'|'A'..'Z'|'_') ('a'..'z'|'A'..'Z'|'0'..'9'|'_'|'.'|'-')*;
WS  :   [ \t\r\n]+ -> skip;