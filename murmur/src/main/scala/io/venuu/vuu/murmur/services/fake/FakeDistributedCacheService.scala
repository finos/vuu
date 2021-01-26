/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 16/06/2020.
 *
 */
package io.venuu.vuu.murmur.services.fake

import java.nio.file.Path

import io.venuu.vuu.murmur.model.ModelConfig
import io.venuu.vuu.murmur.services.definition.{AppDistributedCacheService, CandidateApp, DistributedCacheService}
import monix.reactive.Observable

class FakeAppDistributedCacheService extends AppDistributedCacheService{
  override def deployObservable(): Observable[String] = ???
  override def versionObservable(): Observable[String] = ???
  override def getVersions(): List[String] = ???
  override def getModel: ModelConfig = ???
  override def getAppName: String = ???
  override def addVersion(path: String): Unit = ???
  override def addDeploy(path: String): Unit = ???
}

class FakeDistributedCacheService extends DistributedCacheService {
  override def create(name: String, modelConfig: ModelConfig): AppDistributedCacheService = ???
  override def get(name: String): AppDistributedCacheService = ???
  override def candidateApps(): List[CandidateApp] = ???
  override def addCandidateApp(candidateApp: CandidateApp): Unit = ???
}
