package io.venuu.toolbox.net.tcp

import com.typesafe.scalalogging.StrictLogging

import java.net.ServerSocket
import scala.util.{Failure, Success, Try}

object FreeTcpPortChecker extends StrictLogging{

  def nextFree(): Int = {
    val rnd = new scala.util.Random
    val range = 1024 to 5200

    (1024 to 5200).find( i => {
      available( i )
    }).head
  }

  def nextFreeRandom(): Int = {
    val rnd = new scala.util.Random
    val range = 1024 to 5200

    (1024 to 5200).find( i => {
      val random = range(rnd.nextInt(range.length))
      available( random )
    }).head
  }

  def blockWhile(port: Int)(block: => Unit): Unit = {

    Try(new ServerSocket(port)) match {
      case Success(socket) =>
        logger.info(s"blocked ${port} running func")
         block
         socket.close()
      case Failure(err) =>
        logger.error(s"could not block port ${port}")
    }
  }

  def available(port: Int): Boolean = {

    Try(new ServerSocket(port)) match {
      case Success(socket) =>
        logger.info(s"socket ${port} is free")
        socket.close()
        true
      case Failure(err) =>
        logger.error(s"socket ${port} not available.")
        false
    }

  }

}
