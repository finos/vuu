grammar Filter;

start          : orExpression EOF; // entrypoint
orExpression   : andExpression ('or' andExpression)*;
andExpression  : term ('and' term)*;
term           : '(' orExpression ')' # subexpression
               | ID '='      scalar   # operationEq
               | ID '!='     scalar   # operationNeq
               | ID '>'      NUMBER   # operationGt
               | ID '>='     NUMBER   # operationGte
               | ID '<'      NUMBER   # operationLt
               | ID '<='     NUMBER   # operationLte
               | ID 'starts' STRING   # operationStarts
               | ID 'ends'   STRING   # operationEnds
               | ID 'in'     set      # operationIn
               ;
set            : '[' NUMBER (',' NUMBER)* ']'
               | '[' STRING (',' STRING)* ']'
               | '['                      ']'
               ;
scalar : NUMBER | STRING | BOOLEAN;

// general parsing
WS     : [ \t\r\n]+ -> skip;

// values
BOOLEAN: 'true' | 'false';
NUMBER : DIGIT+ ('.' DIGIT+)?;
ID     : ID_FIRST ID_BODY*;
STRING : '"' STRCHAR* '"' {
   String s = getText();
   assert s.startsWith("\"") && s.endsWith("\"");
   setText(s.substring(1, s.length() - 1)); // strip quotes
 };

fragment ID_FIRST  : [a-zA-Z_];
fragment ID_BODY   : ID_FIRST | DIGIT | '.' | '-';
fragment STRCHAR   : ESC | ~["\\\r\n];
fragment ESC       : '\\' ( ["\\/bfnrt] | UNICODE ) ;
fragment UNICODE   : 'u' HEX HEX HEX HEX ;
fragment DIGIT     : [0-9];
fragment HEX       : [0-9a-fA-F];
