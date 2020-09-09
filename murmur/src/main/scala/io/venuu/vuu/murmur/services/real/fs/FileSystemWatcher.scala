/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 19/06/2020.
 *
 */
package io.venuu.vuu.murmur.services.real.fs

import java.io._
import java.nio.file.StandardWatchEventKinds._
import java.nio.file._
import java.util.HashMap

import scala.collection.JavaConverters


/**
 * Example to watch a directory (or tree) for changes to files.
 */
//object WatchDir {
//  @SuppressWarnings(Array("unchecked")) def cast[T](event: WatchEvent[_]): WatchEvent[T] = event.asInstanceOf[WatchEvent[T]]
//
//  def usage(): Unit = {
//    System.err.println("usage: java WatchDir [-r] dir")
//    System.exit(- 1 )
//  }
//
//  @throws[IOException]
//  def main(args: Array[String]): Unit = { // parse arguments
//    if (args.length == 0 || args.length > 2) usage()
//    var recursive  = false
//    var dirArg  = 0
//    if (args(0) == "-r") {
//      if (args.length < 2) usage()
//      recursive = true
//      dirArg += 1
//    }
//    // register directory and process its events
//    val dir  = Paths.get(args(dirArg))
//    new WatchDir(dir, recursive).processEvents()
//  }
//}

trait DirListener{
    def onCreate(parent: Path, child: Path)
    def onDelete(parent: Path, child: Path)
    def onModify(parent: Path, child: Path)
    def onOverflow(parent: Path)
}

class LoggingDirListener extends DirListener{
  override def onCreate(parent: Path, child: Path): Unit = println("Create: " + parent.toAbsolutePath.toString + " " + child.getFileName )
  override def onModify(parent: Path, child: Path): Unit = println("Modify: " + parent.toAbsolutePath.toString + " " + child.getFileName )
  override def onOverflow(parent: Path): Unit = println("Overflow: " + parent.toAbsolutePath.toString  )
  override def onDelete(parent: Path, child: Path): Unit = println("Delete: " + parent.toAbsolutePath.toString + " " + child.getFileName )
}

class WatchDir(val dir: Path, val listener: DirListener, val listChildrenOnStart: Boolean) {

  private val watcher = FileSystems.getDefault.newWatchService
  private val keys = new HashMap[WatchKey, Path]()
  private var trace  = false
  
  register(dir)

  /**
   * Register the given directory with the WatchService
   */
  @throws[IOException]
  private def register(dir: Path): Unit = {
    val key  = dir.register(watcher, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY)
    if (trace) {
      val prev  = keys.get(key)
      if (prev == null) System.out.format("register: %s\n", dir)
      else if (!(dir == prev)) System.out.format("update: %s -> %s\n", prev, dir)
    }
    keys.put(key, dir)
  }

//  /**
//   * Register the given directory, and all its sub-directories, with the
//   * WatchService.
//   */
//  @throws[IOException]
//  private def registerAll(start: Path): Unit = { // register directory and sub-directories
//    Files.walkFileTree(start, new SimpleFileVisitor[Path]() {
//      @throws[IOException]
//      override def preVisitDirectory(dir: Path, attrs: BasicFileAttributes): FileVisitResult = {
//        register(dir)
//        FileVisitResult.CONTINUE
//      }
//    })
//  }

  /**
   * Process all events for keys queued to the watcher
   */
  def processEvents(): Unit = {
    while ( {
      true
    }) { // wait for key to be signalled

      val key = watcher.take()
      val dir: Path  = keys.get(key)

      if (dir == null) {
        println("WatchKey not recognized!!")
      }

      val pollEvents = JavaConverters.asScalaIterator(key.pollEvents().iterator()).toList

      for (event <- pollEvents) {
        val kind  = event.kind

        kind match {
          case StandardWatchEventKinds.ENTRY_CREATE =>
              val ev = event.asInstanceOf[WatchEvent[Path]]
              val name  = ev.context()
              val child = dir.resolve(name)
              listener.onCreate(dir, child)

          case StandardWatchEventKinds.ENTRY_DELETE =>
            val ev = event.asInstanceOf[WatchEvent[Path]]
            val name  = ev.context()
            val child = dir.resolve(name)
            listener.onDelete(dir, child)

          case StandardWatchEventKinds.ENTRY_MODIFY =>
            val ev = event.asInstanceOf[WatchEvent[Path]]
            val name  = ev.context()
            val child = dir.resolve(name)
            listener.onModify(dir, child)

          case StandardWatchEventKinds.OVERFLOW =>
            listener.onOverflow(dir)
        }

        // reset key and remove from set if directory no longer accessible
        val valid  = key.reset

      }
    }
  }
}
