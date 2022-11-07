# The Tick Path


Vuu is designed to favour an update to an existing row over the addition or removal of a row. 

What does this mean in practice? Well, an update to a row will be passed through to the viewport in the same thread
as the processUpdate() call in the provider (there are some exclusions to this, for example if you are using a joinTable for the viewport.)

Changes to the contents of a viewport (i.e. the keys that compose it) are done on the sort and filter thread. That takes 
the underlying table, applies the sorts and filters and publishes them through to the viewport. 

Assuming the tables you are operating on are not enormous (< 3m rows say), the difference will be imperceptible but it is 
an important concept in understanding how the vuu server works.   

