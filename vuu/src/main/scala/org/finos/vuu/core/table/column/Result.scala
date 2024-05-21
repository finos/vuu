package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.Result.toResult

import java.util.Optional
import scala.jdk.javaapi.OptionConverters
import scala.util.Try

sealed trait Result[+T] {
  def isSuccess: Boolean = toEither.isRight
  def isError: Boolean = toEither.isLeft
  def map[B](fn: T => B): Result[B] = toResult(toEither.map(fn))
  def flatMap[B](fn: T => Result[B]): Result[B] = toResult(toEither.flatMap(fn(_).toEither))
  def fold[B](error: String => B, success: T => B): B = toEither.fold(error, success)
  def join[B, R](r: Result[B])(apply: (T, B) => R): Result[R] = this.flatMap(v1 => r.map(apply(v1, _)))
  def joinWithErrors[B, R](r: Result[B])(apply: (T, B) => R, errorSep: String): Result[R] =
    if (this.isError && r.isError) Error(this.getError + errorSep + r.getError) else this.join(r)(apply)

  def toEither: Either[String, T] = this match { case Success(value) => Right(value); case Error(msg) => Left(msg) }
  def toOption: Option[T] = toEither.toOption
  def toOptional[T1 >: T]: Optional[T1] = OptionConverters.toJava(toOption)
  def getValue: T = throw new Exception("Unexpected error occurred: cannot get value from an error result.")
  def getError: String = throw new Exception("Unexpected error occurred: cannot get error message from a success result.")
}

object Result {
  def toResult[T](e: Either[String, T]): Result[T] = e match {
    case Right(v)  => Success(v)
    case Left(msg) => Error(msg)
  }

  def toResult[T](x: Try[T]): Result[T] = x match {
    case scala.util.Success(v) => Success(v)
    case scala.util.Failure(e) => Error(e.getMessage)
  }

  def apply[T](v: T): Result[T] = Success(v)
}

case class Success[+T](private val value: T) extends Result[T] {
  override def getValue: T = value
}

case class Error(private val msg: String) extends Result[Nothing] {
  override def getError: String = msg
}