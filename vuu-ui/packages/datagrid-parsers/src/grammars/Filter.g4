grammar Filter;

TRUE: 'true';
FALSE: 'false';
AND: 'and';
OR: 'or';
AS: 'as';
LT: '<';
GT: '>';
EQ: '=';
NEQ: '!=';
IN: 'in';
CONTAINS: 'contains';
STARTS: 'starts';
ENDS: 'ends';
// PATHSEP : '/';
LBRACK: '[';
RBRACK: ']';
LPAREN: '(';
RPAREN: ')';
COMMA: ',';
COLON: ':';

expression: or_expression as_clause? EOF;

or_expression: and_expression (OR or_expression)*;

and_expression: term (AND term)*;

as_clause: AS filtername;

term:
	col_val_expression
	| col_set_expression
	| named_filter
	| LPAREN or_expression RPAREN;

col_set_expression: (column | string_column) IN LBRACK atoms RBRACK;

col_val_expression:
	numeric_col_val_expression
	| string_col_val_expression
	| default_col_val_expression;

numeric_col_val_expression:
	numeric_column numeric_operator atom;
string_col_val_expression: string_column string_operator atom;
default_col_val_expression: column operator atom;

atoms: atom (COMMA atom)*;

atom:
	ID
	| INT
	| FLOAT
	| STRING
	| TRUE
	| FALSE
	| INT_ABBR
	| FLOAT_ABBR;

numeric_column: ID_NUMERIC;
string_column: ID_STRING;

column: ID;

filtername: ID;

named_filter: COLON ID;

string_operator: substring_operator | equality_operator;
numeric_operator: comparison_operator | equality_operator;

equality_operator: EQ | NEQ;
comparison_operator: LT | GT;
substring_operator: STARTS | ENDS | CONTAINS;
operator: LT | GT | EQ | NEQ | STARTS | ENDS;

INT: '0' ..'9'+;
FLOAT: ('0' ..'9')+ '.' ('0' ..'9')*;
INT_ABBR: ('1' ..'9')+ ('k' | 'K' | 'm' | 'M');
FLOAT_ABBR: ('0' ..'9')+ '.' ('0' ..'9')+ ('k' | 'K' | 'm' | 'M');
STRING:
	'"' ('a' ..'z' | 'A' ..'Z' | '0' ..'9' | '.' | '-' | ' ')* '"';
ID_STRING: 'ss' ('s')*;
ID_NUMERIC: 'nn' ('n')*;
ID: ('a' ..'z' | 'A' ..'Z' | '_') (
		'a' ..'z'
		| 'A' ..'Z'
		| '0' ..'9'
		| '_'
		| '@'
		| '.'
		| '-'
	)*;
WS: [ \t\r\n]+ -> skip;
