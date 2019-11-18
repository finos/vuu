# murmur
###A scheduling and upgrade system

**Directory Structure**

As we want to deploy more than one app at a time within an instance of murmur, my porposed directory
structure is something similar to this:

THe root directory will be this
/opt/venuu/app

of which murmur will be a deployed app of its worn:
/opt/venuu/app/murmur

Under this will be a number of directories:

* /opt/venuu/app/murmur/deploy  - contains the .tar.gz files that make up the deployments
* /opt/venuu/app/murmur/version - the unpacked versions of the system that we can upgrade/downgrade to
* /opt/venuu/app/murmur/logs
* /opt/venuu/app/murmur/.cache  - cache for the state in zookeeper
* /opt/venuu/app/murmur/pid

Then within the version directory we will have

* /opt/venuu/app/murmur/version/2019-01-02-murmur/model
* /opt/venuu/app/murmur/version/2019-01-02-murmur/scripts
* /opt/venuu/app/murmur/version/2019-01-02-murmur/lib

properties of a process:

`
classes : {
ems : {
        script        :  "${version.dir}/scripts/start-zk.bsh",
        log           :  "${app.dir}/logs/murmur-log",
        days          :  "Mo Tu We Th Fr",        
        restart-times :  "01:00:00",
        timeZone      :  "Europe/London",   
        start-times   : [ """ ],
        stop-times    : [ """ ],
        upgrade-sequence: 1,    
        smoke-test    : jmx::blah,            
}
}
processes : [
    {
        name : "ems-1",
        type : "ems",
        upgrade-sequence: 2
    },
    {
        name : "ems-2",
        type : "ems",
        upgrade-sequence: 3
    },   
]
`













  