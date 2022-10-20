# Debugging JSON messages on the wire

## I'd like to see the messaging on the wire, how can I do that?

There is a provided logback config in the src/main/resources folder that will turn on debug logging at the inbound and outbound socket level:

You can use this config by specifying the property into your java options: 

```
-Dlogback.configurationFile=logback-socket.xml
```

You can also see the full details about how Netty is configuring your socket connectivity by supplying: 

```
-Dlogback.configurationFile=logback-netty.xml
```



