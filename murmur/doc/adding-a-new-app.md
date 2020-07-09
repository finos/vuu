# murmur
###Adding a new App to Murmur

A new App is added to Murmur by scp-ing a versioned file to the directory (as below):

        /<root-dir>/app/<app-name>/version/<app>-<version>.tag.gz
        
You should then be able to select the app name from a dropdown in the UI, you can then select the initial version that you have deployed.

At this point murmur will create a .cachedversion file within that directory app directory and will add this app to the list of apps running within murmur. 

Murmur will use this cached version file to decide which version to use when the system is restarted.   
