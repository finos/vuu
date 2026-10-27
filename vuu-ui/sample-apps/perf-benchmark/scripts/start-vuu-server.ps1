# Builds (if needed) and launches the real VUU server (BenchmarkMain) that
# backs the "vuu" and "ag-grid-vuu" benchmark variants. Uses the repo's own
# Maven Wrapper (mvnw.cmd at the repo root) rather than managing a private
# Maven install - the wrapper bootstraps the correct Maven version itself,
# so the only prerequisite is a JVM on PATH.

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..\..\..")          # vuu-repo/
$serverModuleDir = Join-Path $repoRoot "example\main"
$mvn = Join-Path $repoRoot "mvnw.cmd"
$classpathFile = Join-Path $scriptDir "main-classpath.txt"

# -Djavax.net.ssl.trustStoreType=Windows-ROOT: on a machine where HTTPS
# traffic is intercepted for inspection (a corporate proxy or antivirus doing
# TLS inspection, common on managed Windows machines), the JVM's own bundled
# trust store won't trust the intercepting certificate even though Windows
# itself does - which is why a browser or npm works fine but a plain mvn
# call can fail TLS validation when downloading dependencies. Pointing the
# JVM at the Windows certificate store directly (the same store the browser
# and npm already trust) fixes this generically, with no certificate
# export/import and no change to anyone's antivirus/proxy configuration
# required.
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
