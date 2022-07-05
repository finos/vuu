# What are the trade offs

Here are some trade-offs for view servers in general and Vuu itself 

1. View servers are complicated pieces of software and adding them into your stack adds complexity. 
2. VS's move more processing from the client to the server, so if you're worried about server capacity, it may not be for you. 
3. Vuu itself favours the tick path, this means that when you have aggregates (see trees later) you can end up with 
eventually consistent aggregates vs column values. For example if my tree has a Sum(orders.price) and the price is changing
every second, your total will only be calculated on a cycle, not on every tick. THis is mostly fine, but can cause issues
with some systems. 
