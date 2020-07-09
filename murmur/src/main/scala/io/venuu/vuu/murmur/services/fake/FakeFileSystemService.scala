/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 08/06/2020.
 *
 */
package io.venuu.vuu.murmur.services.fake

import java.nio.file.Path

import io.venuu.vuu.murmur.services.definition.FileSystemService
import monix.eval.Task
import monix.reactive.Observable

class EventableIterator[TYPE] extends Iterator[TYPE]{

  @volatile
  private var queue = List[TYPE]()

  def onCreate(items: List[TYPE]): EventableIterator[TYPE] ={
    queue = items
    this
  }

  def onNew(t: TYPE): Unit ={
    queue = queue ++ List(t)
  }
  override def hasNext: Boolean = {
    true
  }

  private def blockTillMore(): TYPE = {
    while(queue.length == 0){
      Thread.sleep(10)
    }
    val head = queue.head
    queue = queue.tail
    head
  }

  override def next(): TYPE = {
    queue match {
      case head :: tail =>
        queue = tail
        head
      case head:: Nil =>
        head
      case Nil =>
        blockTillMore()
    }
  }
}

class FakeFileSystemService extends FileSystemService {

  override def deployExists(path: Path): Boolean = ???

  @volatile
  private var paths = Map[Path, Path]();

  private var iterables = List[EventableIterator[Path]]()

  private val lock = new Object

  def addListOnStartup(initialPaths: List[Path]): Unit ={
    initialPaths.foreach( p => {
      paths = paths + (p -> p)
    })
  }

  def addNewDeploy(path: Path) = {
    println("adding new path:" + path.toString)
    lock.synchronized{
      iterables.foreach(e => e.onNew(path))
      paths = paths + (path -> path)
    }
  }

  private def publishNew(path: Path) = ???
  private def publishUpdate(path: Path) = ???
  private def publishDelete(path: Path) = ???

  override def deployObservable: Observable[Path] = {
    val task = Task{
      val iterable = getDeployIter()
      iterables = iterables ++ List(iterable)
      iterable
    }
    Observable.defer{
      Observable.fromIterator(task)
    }
  }

  private def getDeployIter(): EventableIterator[Path] = {
    new EventableIterator[Path]{
    }.onCreate(this.paths.keys.toList)
  }

  override def unzip(path: Path): Boolean = ???
  override def versionObservable: Observable[Path] = ???
}
