/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 19/06/2020.
 *
 */
package io.venuu.vuu.murmur.services.fs

import java.nio.file.{Path, Paths}

import io.venuu.vuu.murmur.services.real.fs.{DirListener, LoggingDirListener, WatchDir}
import org.scalatest.{FeatureSpec, Matchers}

class FileSystemWatcherTest extends FeatureSpec with Matchers {

  feature("FS Watcher") {

    scenario("FS Watcher Test") {

         val watcher = new WatchDir(Paths.get("/Users/chris/Documents/GitHub/vuu/toolbox/src/test/resources/www/murmur/deploy"), new LoggingDirListener, true)

          watcher.processEvents()
      
    }

  }

}
