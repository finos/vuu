# murmur
###A scheduling and upgrade system

**Directory Structure**

As we want to deploy more than one app at a time within an instance of murmur, my proposed directory
structure is something similar to this:

THe root directory will be this
    
    /opt/venuu/app

of which murmur will be a deployed app of its worn:
 
    /opt/venuu/app/murmur

AppConfig Section
 
        magic-variables : {
                //default magic vars added by murmur: $root-dir, $app-dir, $run-date, $version, $version-dir
                my-variable -1  :  "foo bar",
                my-variable -2  :  "${my-variable-1} bar", 
                my-variable -3  :  "${run-date}",          
        }    

Under this will be a number of directories:

    * /opt/venuu/app/murmur/deploy  - contains the .tar.gz files that make up the deployments
    * /opt/venuu/app/murmur/version - the unpacked versions of the system that we can upgrade/downgrade to
    * /opt/venuu/app/murmur/logs
    * /opt/venuu/app/murmur/.cache  - cache for the state in zookeeper
    * /opt/venuu/app/murmur/.cacheversion  - the last version that was used    
    * /opt/venuu/app/murmur/pid
    * /opt/venuu/app/murmur/upgrade (place holder for upgrade workflow)
    
these directories will be modelled in zookeeper also        

Then within the version directory we will have

    * /opt/venuu/app/murmur/version/2019-01-02-murmur/model
    * /opt/venuu/app/murmur/version/2019-01-02-murmur/scripts
    * /opt/venuu/app/murmur/version/2019-01-02-murmur/lib
    * /opt/venuu/app/murmur/version/2019-01-02-murmur/processes
    

properties of a process:

    classes : [
        ems : {
                script        :  "${version.dir}/scripts/start-zk.bsh",
                log           :  "${app.dir}/logs/murmur-${run-date}.log",
                days          :  "Mo Tu We Th Fr",        
                restart-times :  ["01:00:00"],
                timeZone      :  "Europe/London",   
                start-times   : [ """ ],
                stop-times    : [ """ ],
                upgrade-sequence: 1,    
                smoke-test    : jmx::blah,            
        }
    ]
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

A multi-app deployment would look something like this:

    /opt/venuu/app/murmur/deploy  - contains the .tar.gz files that make up the deployments
                         /version - the unpacked versions of the system that we can upgrade/downgrade to
                         /log
                         /.cache  - cache for the state in zookeeper
                         /pid
                         
     /opt/venuu/app/vuu/deploy  - contains the .tar.gz files that make up the deployments
                         /version - the unpacked versions of the system that we can upgrade/downgrade to
                         /log
                         /.cache  - cache for the state in zookeeper
                         /pid

When we start  murmur up, we'd expect it to only be hosting itself. So on startup we'd expect the Zookeeper module to contain something like this:                         

    app/murmur/deploy/murmur-0.1.zip
    app/murmur/deploy/murmur-0.2.zip
    app/murmur/version/murmur-0.1
    app/murmur/version/murmur-0.2
    app/murmur/processes/zk-01
    app/murmur/processes/zk-02
    app/murmur/processes/zk-03
    app/murmur/processes/mrm-01    
    app/murmur/processes/mrm-02
    app/murmur/processes/mrm-03    
    app/murmur/upgrade/from
    app/murmur/upgrade/to
    app/murmur/upgrade/queue
    












  