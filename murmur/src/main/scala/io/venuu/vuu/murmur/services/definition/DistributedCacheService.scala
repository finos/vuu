/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 07/05/2020.
 *
 */
package io.venuu.vuu.murmur.services.definition

import io.venuu.toolbox.lifecycle.DefaultLifecycleEnabled
import io.venuu.vuu.murmur.model.ModelConfig
import monix.reactive.Observable

trait AppDistributedCacheService{
  def deployObservable(): Observable[String]
  def versionObservable(): Observable[String]
  def getVersions(): List[String]
  def getModel: ModelConfig
  def getAppName: String
  def addVersion(path: String)
  def addDeploy(path: String)
}

case class CandidateApp(name: String, versions: List[String])

trait DistributedCacheService extends DefaultLifecycleEnabled {
  def create(name: String, modelConfig: ModelConfig): AppDistributedCacheService
  def get(name: String): AppDistributedCacheService
  def candidateApps(): List[CandidateApp]
  def addCandidateApp(candidateApp: CandidateApp)
}