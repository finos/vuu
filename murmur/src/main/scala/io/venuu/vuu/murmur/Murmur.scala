/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 07/05/2020.
 *
 */
package io.venuu.vuu.murmur

import io.venuu.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import io.venuu.toolbox.thread.RunInThread
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.murmur.model.ModelConfig
import io.venuu.vuu.murmur.services.definition.{DistributedCacheService, FileSystemService, ProcessMonitorService, ScheduleService, UpgradeService}
import org.eclipse.jetty.util.component.LifeCycle

class Murmur(val configs: List[ModelConfig],
                      val cache: DistributedCacheService, val fileSystem: FileSystemService, val processMon: ProcessMonitorService,
                      val schedule: ScheduleService, val upgrade: UpgradeService)
                      (val lifecycle: LifecycleContainer, val clock: Clock) extends DefaultLifecycleEnabled with RunInThread {

  lifecycle.apply(this).dependsOn(cache, fileSystem, processMon, schedule, upgrade)

  override def runOnce(): Unit = ???

  override def doStart(): Unit = {

    //    configs.foreach( config => {
    //        cache.app(config).deployStream().foreach( (config, v) => onNewPublishedVersion(config, v))
    //    })
    //
    //    cache.onNewDeployStream().map(version => {
    //      fileSystem.deployExists(version)
    //      fileSystem.unpack(version)
    //    }
    //    )
    //
    //    configs.toStream.foreach(config => {
    //
    //    })
    //  }
    //
    //  def onNewPublishedVersion(modelConfig: ModelConfig, version: String): Unit ={
    //    if(fileSystem.app(modelConfig).deployExists(version)) {
    //      fileSystem.app(modelConfig).unzip(version)
    //    }else{
    //      webservice.app(modelConfig).download(version)
    //    }
    //  }
    //
    //  def runOnce(): Unit ={
    //
    //
    //
    //
    //  }

  }
  }
