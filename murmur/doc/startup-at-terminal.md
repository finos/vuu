# murmur
###What will happen on startup?

The script: murmur-bootstrap.sh (found in root of directory) is designed to run all time the in a cron-like process. If it ever shuts down, the cron-process should restart it.

This process will look for the cached murmur version number from the file:

    /opt/venuu/app/murmur/.cachedversion
 
When it has found this it will read a version from the file:

example:
    
    murmur-0.1   

it will then start the version:

    /opt/venuu/app/murmur/version/murmur-0.1/scripts/start-murmur-cold.sh
 
This script will check that zookeeper is running, if not it will run it by using:
    
    /opt/venuu/app/murmur/version/murmur-0.1/scripts/start-zookeeper.sh    

It will then run:

    /opt/venuu/app/murmur/version/murmur-0.1/scripts/start-murmur.sh
      
Which will run the viewserver process which will connect to zookeeper on startup and form the cluster.

For more details of the internals post startup see: [startup-internals](startup-internal.md) 
  