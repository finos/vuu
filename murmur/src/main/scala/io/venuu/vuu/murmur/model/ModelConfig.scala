/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 07/05/2020.
 *
 */
package io.venuu.vuu.murmur.model

case class ClassConfig(name: String, script: String, log: String, days: String, restartTimes: List[String],
                                    timeZone: String, startTimes: List[String], stopTimes: List[String],
                                    appArgs: String = "",  upgradeSequence: Int = -1, smokeTest: String = "", restartOnUpgrade: Boolean = false)
case class Process(processType: String, name: String, upgradeSequence: Int, cpu: String = "", pinnedCore: String = "", appArgs: String = "")
case class AppOptions(rootDir: String, appDir: String, appName: String, cacheDir: String, magicVariables: Map[String, String], isMurmurApp: Boolean, env: String)
case class IpHostName(ip: String, hostname: String, interface: String, usage: String)
case class CpuSocket(id: String, cores: Int)
case class Host(id: String,  shortName: String, ips:List[IpHostName], cpus: List[CpuSocket])
case class ModelConfig(app: AppOptions, classes: List[ClassConfig], processes: Map[String, List[Process]], hosts: List[Host])
