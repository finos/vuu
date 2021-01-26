# murmur
###What will happen on startup - Murmur Internals?

When the murmur java process has been started by the bootstrap, the process proceeds to:

1) Scan all directories under /<root-dir>/app/ and for each one, look for a .cachedversion file (sam e as murmur itself)
2) if no cached version file is found, it will not proceed
3) if a cached version is found, it will look for that version under the:
    
        /<root-dir>/app/<app-name>/version
        
      directory
4) When it finds that directory  it will look for the model.json file in the config directory. 
5) It will then read this model.json file, register it internally and begin to start processes (if they are not running already)       
