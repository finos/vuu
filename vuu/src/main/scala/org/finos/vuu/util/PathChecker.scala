package org.finos.vuu.util

import java.io.File
import java.nio.file.FileSystems

object PathChecker {

  def throwOnFileNotExists(path: String, msg: String): Unit = {
      if(!(new File(path).exists() && new File(path).isFile)){
        throw new RuntimeException(msg + ":" + new File(path).getAbsolutePath)
      }
  }

  def throwOnDirectoryNotExists(path: String, msg: String): Unit = {
    val file = FileSystems.getDefault.getPath(path).resolve("index.html").getParent.toFile
    if(!(file.exists() && file.isDirectory)){
      throw new RuntimeException(msg + ":" + file.getAbsolutePath)
    }
  }

}
