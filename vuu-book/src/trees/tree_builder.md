# Tree Builder

The Tree Builder is a component that sits on a separate thread, in a similar manner to the Filter and Sort functionality in the viewport container. 
It's purpose is to, each cycle, produce a tree'd representation of an underlying table and to generate the Tree Keys for the underlying
table keys. 

THe tree Keys are injected into the Viewport in the same way normal keys are injected into flat viewports.  
