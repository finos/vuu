# Builds (if needed) and launches the real VUU server (BenchmarkMain) that
# backs the "vuu" and "ag-grid-vuu" benchmark variants. Self-contained: no
# manual Maven install, no certificate/trust-store setup required from
# whoever runs this.
#
# Two portability notes, both confirmed working (not assumed) on this
# machine's network path, and both generic (not tied to any specific
# antivirus/proxy product):
#   - Maven is downloaded via Invoke-WebRequest with TLS 1.2 forced.
#     PowerShell 5.1 doesn't always negotiate TLS 1.2 by default against
#     modern endpoints, which can otherwise hang rather than fail cleanly.
#   - The JVM is pointed at the Windows certificate store directly
#     (-Djavax.net.ssl.trustStoreType=Windows-ROOT) for the Maven build
#     step, so it trusts whatever Windows already trusts - the same store
#     the browser and npm use - instead of the JVM's own separate bundled
#     trust store. No certificate export/import of any kind.

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$scriptDir = $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..\..\..")          # vuu-repo/
$serverModuleDir = Join-Path $repoRoot "example\main"
$toolsDir = Join-Path $scriptDir ".tools"
$mavenVersion = "3.9.12"
$mavenHome = Join-Path $toolsDir "apache-maven-$mavenVersion"
$mavenBin = Join-Path $mavenHome "bin\mvn.cmd"
$classpathFile = Join-Path $toolsDir "main-classpath.txt"

function Get-Maven {
    $onPath = Get-Command mvn -ErrorAction SilentlyContinue
    if ($onPath) {
        Write-Host "[start-vuu-server] using mvn already on PATH: $($onPath.Source)"
        return $onPath.Source
    }
    if (Test-Path $mavenBin) {
        Write-Host "[start-vuu-server] using cached Maven at $mavenBin"
        return $mavenBin
    }
    Write-Host "[start-vuu-server] downloading Apache Maven $mavenVersion..."
    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
    $zipPath = Join-Path $toolsDir "apache-maven-$mavenVersion-bin.zip"
    $url = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$mavenVersion/apache-maven-$mavenVersion-bin.zip"
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
    Remove-Item $zipPath
    return $mavenBin
}

$mvn = Get-Maven
$env:MAVEN_OPTS = "-Djavax.net.ssl.trustStoreType=Windows-ROOT"

Push-Location $repoRoot
try {
    Write-Host "[start-vuu-server] building main module and its dependencies..."
    # -am (also-make) on example/main alone is required, not just example/price:
    # example/main depends directly on several other modules (basket, order,
    # editable, permission, rest-api, virtualized-table, ...) that a
    # price-only build would never install. Building price on its own first
    # and skipping -am on main only appears to work on a machine whose local
    # Maven cache already has the rest of the reactor from an earlier build.
    & $mvn install -pl example/main -am -DskipTests -B -q
    if ($LASTEXITCODE -ne 0) { throw "mvn install (main) failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

Push-Location $serverModuleDir
try {
    $rootPomFile = Join-Path $repoRoot "pom.xml"
    $pricePomFile = Join-Path $repoRoot "example\price\pom.xml"
    $mainPomFile = Join-Path $repoRoot "example\main\pom.xml"
    $newestPomWrite = @($rootPomFile, $pricePomFile, $mainPomFile) | ForEach-Object { (Get-Item $_).LastWriteTime } | Sort-Object -Descending | Select-Object -First 1
    if (-not (Test-Path $classpathFile) -or (Get-Item $classpathFile).LastWriteTime -lt $newestPomWrite) {
        Write-Host "[start-vuu-server] building runtime classpath..."
        & $mvn dependency:build-classpath "-Dmdep.outputFile=$classpathFile" -q
        if ($LASTEXITCODE -ne 0) { throw "mvn dependency:build-classpath failed with exit code $LASTEXITCODE" }
    }
    # .Trim() matters: the classpath file (written by mvn dependency:build-classpath)
    # ends in a trailing newline, which otherwise corrupts the multi-line java
    # invocation below (arguments after it get mis-parsed).
    $classpath = (Get-Content $classpathFile -Raw).Trim()

    Write-Host "[start-vuu-server] starting BenchmarkMain on ws://localhost:8090/websocket ..."
    # The -D flag must be quoted: the Oracle "javapath" redirector shim that
    # `java` resolves to on this PATH mis-parses an unquoted -Dkey.sub=value
    # argument (drops the "-Dkey" portion and passes only ".sub=value" through,
    # which java then tries to load as the main class).
    & java -Xmx4096m `
        -classpath "target\classes;$classpath" `
        "-Dlogback.configurationFile=logback-netty.xml" `
        org.finos.vuu.BenchmarkMain
} finally {
    Pop-Location
}
