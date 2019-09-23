/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 26/02/2016.

  */
package io.venuu.toolbox.consensus

trait ClusterChangeListener{
  def onChange()
}

trait Election {
  def name: String
  //def connectionString: String
  def addListener(listener: ClusterChangeListener): Unit
  def connect(): Election
  def disconnect(): Unit
}
