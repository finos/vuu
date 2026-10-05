# Dev Container — Toolchain, Python and Nested Podman

**Status: Implemented.** The `.devcontainer/` set-up described below exists and has been verified
end-to-end with the [Dev Containers CLI](https://github.com/devcontainers/cli) on a Podman host
(macOS, Podman 6.1): the image builds, `devcontainer up` runs the `postStartCommand`, every tool
reports the expected version, a nested `podman run -p` serves HTTP on its published port, and the
full `plugin/clickhouse-plugin` test suite (Testcontainers + ClickHouse) passes inside the
container — 137 tests, `BUILD SUCCESS`. It has **not** yet been verified with Docker Engine/Docker
Desktop as the host engine, nor through IntelliJ's Dev Containers integration (see
[Limitations](#limitations-and-risks)).

### Introduction

The repo's dev container previously provided JDK 17, Maven 3.9.6, Scala 2.13.10 and Node 18.17.
That no longer matched the project:

- CI builds and releases with **JDK 21** (`.github/workflows/*.yml`); the code targets
  `--release 17` (`maven.compiler.release` in the root `pom.xml`) and is tested on 17/21/25.
- The Maven wrapper pins **Maven 3.9.16**.
- The project uses **Scala 3.3.8** (`vuu.scala.version`); SDKMAN's 2.13.10 download was also
  failing as corrupt, which broke the image build outright.
- `vuu-ui/package.json` requires **Node >= 20**.
- `example/python-integration` needs **Python 3** with a venv and **JPype**
  (`requirements.txt`).
- `plugin/clickhouse-plugin`'s tests start ClickHouse via **Testcontainers**, which needs a
  container engine reachable through the Docker API. The container had none, so the Maven build
  failed with *"Previous attempts to find a Docker environment failed. Will not retry."*

### Goals

1. Provide the JDK, Maven, Scala, Node/npm and Python versions the project actually uses.
2. Pre-install `example/python-integration`'s Python requirements at image build time.
3. Provide **Podman** inside the container, usable both directly (`podman run`/`podman build`)
   and by Testcontainers, so a full `./mvnw install` — including `clickhouse-plugin` — works
   inside the dev container.

### Non-goals

- Changing the project's own build or tests (no `pom.xml`/test changes were required).
- Docker-in-Docker or mounting the host's Docker socket — the container runs its own rootless
  Podman, independent of whichever engine the host uses.
- CI: GitHub Actions does not use this dev container.

---

## Toolchain

| Tool    | Version              | Source                                                     | Why this version                                         |
|---------|----------------------|------------------------------------------------------------|----------------------------------------------------------|
| JDK     | 21 (MS OpenJDK)      | Base image `mcr.microsoft.com/devcontainers/java:21-trixie` | Matches CI build/release JDK; code still targets 17      |
| Maven   | 3.9.16               | SDKMAN (`install-sdk-packages.sh`)                         | Latest stable (4.0 is still RC); same as `./mvnw`        |
| Scala   | 3.3.8                | SDKMAN (`install-sdk-packages.sh`)                         | Matches `vuu.scala.version` in root `pom.xml`            |
| Node    | latest (26.x at time of writing) | Dev Container feature `node:2`, `version: latest`  | Requested "latest"; satisfies `>=20`                     |
| npm     | latest (12.x at time of writing) | Dev Container feature `node:2`, `npmVersion: latest` | Requested "latest"                                     |
| Python  | 3.13                 | Debian trixie `python3`                                    | Distro default for the base image                        |
| JPype   | per `requirements.txt` (1.7.x) | pip, into `/opt/venv`                            | `example/python-integration/python/requirements.txt`     |
| Podman  | 5.4                  | Debian trixie `podman`                                     | Distro default for the base image                        |

The base image moved from Debian bookworm (`java:17`) to **trixie** (`java:21-trixie`) because
trixie ships Python 3.13 and Podman 5.x in its own repos — no third-party apt sources needed.

Node 26 is a *Current* (non-LTS) release. Teams wanting LTS should set the feature's `version` to
`"lts"`.

---

## Design

### Files

| File | Role |
|------|------|
| `.devcontainer/devcontainer.json` | Build config (incl. extra build context), Node feature, `runArgs`, `containerEnv`, `postStartCommand`, VS Code extensions |
| `.devcontainer/Dockerfile` | Base image, apt packages, rootless Podman config, Python venv, SDKMAN installs |
| `.devcontainer/install-sdk-packages.sh` | SDKMAN installs of Maven and Scala |
| `.devcontainer/start-podman-service.sh` | Starts Podman's Docker-compatible API socket (idempotent) |
| `.devcontainer/generate-dev-certs.sh` | Generates the self-signed TLS cert/key for the example servers (idempotent) — see the addendum |

### Python requirements at build time

The Dockerfile's build context is `.devcontainer/`, so `example/python-integration/python/
requirements.txt` is not visible to it. Rather than widening the context to the repo root (≈1.2 GB
on a developer checkout, re-sent on every build), `devcontainer.json` passes **only that folder** as
a named BuildKit/Buildah build context:

```jsonc
"options": [
  "--build-context=python-integration=${localWorkspaceFolder}/example/python-integration/python"
]
```

and the Dockerfile copies from it:

```dockerfile
COPY --from=python-integration requirements.txt /tmp/requirements.txt
```

Debian's system Python is "externally managed" (PEP 668), so packages go into a venv at
`/opt/venv`, which is owned by `vscode` (so further `pip install`s work) and placed first on
`PATH` via `ENV`. The module's own documented flow (`python3 -m venv .venv` in
`example/python-integration/python`, used by `run_tests.sh`) is unaffected and still works.

Changing `requirements.txt` requires a container rebuild to be reflected in `/opt/venv`.

### Rootless Podman inside the container

Podman runs **rootless as the `vscode` user**, nested inside the dev container. That needs:

**In the image (`Dockerfile`)**

| Item | Purpose |
|------|---------|
| `podman` | The engine |
| `uidmap` + `/etc/subuid`, `/etc/subgid` entries for `vscode` | User-namespace ID ranges for rootless containers |
| `fuse-overlayfs` + `storage.conf` (`driver = "overlay"`, `mount_program = fuse-overlayfs`) | Overlay storage without kernel overlay-in-userns support |
| `passt` (pasta), `slirp4netns` | Rootless container networking; pasta is Podman 5's default |
| `nftables` | `netavark` shells out to `nft` to set up the default bridge network / port forwards |
| `curl` | Health check of the API socket in `start-podman-service.sh` |
| `containers.conf` | `cgroups = "disabled"`, `cgroup_manager = "cgroupfs"`, `events_logger = "file"`, `log_driver = "k8s-file"`, and host `userns`/`ipcns`/`utsns`/`cgroupns` — no systemd or cgroup delegation exists inside the dev container |

Containers deliberately get their **own network namespace** (no `netns = "host"`). With host
networking Podman silently ignores `-p` port mappings, and Testcontainers always connects to a
container through its mapped port.

**At run time (`runArgs` in `devcontainer.json`)**

| Flag | Why |
|------|-----|
| `--device=/dev/fuse` | `fuse-overlayfs` storage |
| `--device=/dev/net/tun` | pasta/slirp4netns create a tap device (`Failed to open() /dev/net/tun` without it) |
| `--cap-add=SYS_ADMIN` | Mounts and namespace creation for nested containers |
| `--cap-add=MKNOD` | Device nodes in nested container rootfs |
| `--security-opt=seccomp=unconfined` | Default seccomp profile blocks `unshare`/`mount` used by nested containers |
| `--security-opt=apparmor=unconfined` | Same, for AppArmor hosts |
| `--security-opt=label=disable` | Same, for SELinux hosts |
| `--security-opt=systempaths=unconfined` | Unmasks `/proc`; nested `crun` otherwise fails with `mount proc: Operation not permitted` |

### Testcontainers

Testcontainers does not shell out to `podman`; it speaks the **Docker Engine API** over a socket.
Podman provides a compatible API via `podman system service`.

- `start-podman-service.sh` (copied to `/usr/local/bin/`) starts
  `podman system service --time=0 unix:///home/vscode/.podman/podman.sock` detached
  (`setsid nohup`), logging to `~/.podman/podman-service.log`, and waits for `/_ping` to answer.
  If the socket is already answering it exits immediately, so it is safe to run repeatedly.
- `devcontainer.json` runs it as the **`postStartCommand`**, i.e. on every container start, not
  just creation.
- `containerEnv` sets:
  - `DOCKER_HOST=unix:///home/vscode/.podman/podman.sock` — Testcontainers' environment-variable
    strategy picks this up (*"Found Docker environment with Environment variables…"*); the Docker
    CLI and other Docker-API tools will also use it.
  - `TESTCONTAINERS_RYUK_DISABLED=true` — Ryuk, Testcontainers' resource reaper, runs as a
    privileged container with the API socket mounted into it, which nested rootless Podman cannot
    provide.

### Lifecycle summary

1. **Build:** base image → apt packages → rootless Podman config → `/opt/venv` + requirements →
   copy `start-podman-service.sh` → SDKMAN (Maven, Scala) → Node feature (Node, npm, nvm, yarn,
   pnpm).
2. **Create/start:** container runs with the `runArgs` above and `containerEnv`.
3. **Post-start:** `start-podman-service.sh` brings the Podman API socket up, and
   `generate-dev-certs.sh` makes sure the example servers' TLS cert exists (see the addendum).

---

## Alternatives considered

| Alternative | Outcome |
|-------------|---------|
| **Buildah instead of Podman** | Implemented and verified (with `BUILDAH_ISOLATION=chroot`, which also needed `netavark`/`aardvark-dns`/`passt` and allowed dropping `MKNOD` and `systempaths=unconfined`), then reverted at the user's request in favour of Podman. Buildah alone also cannot serve the Docker API, so it would not have solved Testcontainers. |
| **Repo root as build context** | Rejected: ≈1.2 GB context re-sent each build. Named extra build context used instead. |
| **`pip install` into system Python** | Rejected: blocked by PEP 668 on Debian trixie; would need `--break-system-packages`. |
| **`netns = "host"` for nested containers** | Initially used (simplest networking), then removed: port publishing is ignored under host networking, which breaks Testcontainers. |
| **Node feature `node:1`** | Ignores `npmVersion` (npm stayed at the Node-bundled version); `node:2` honours it. |
| **`--privileged`** | Would work, but the explicit device/capability/security-opt list grants less. |
| **Mounting the host's Docker socket** | Rejected: host engine varies (Docker, Podman machine, Colima), socket paths differ, and container ports would be published on the host rather than inside the dev container. |

---

## Verification performed

All run with the Dev Containers CLI using Podman as the host engine
(`npx @devcontainers/cli build|up --docker-path podman`):

- Image builds cleanly (`--no-cache` as well as cached).
- Versions inside the container: `node v26.10.0`, `npm 12.2.0`, `openjdk 21.0.12.1`,
  `Apache Maven 3.9.16`, `Scala 3.3.8`, `Python 3.13.5`, `podman 5.4.2`.
- `python3`/`pip` resolve to `/opt/venv`; `import jpype; jpype.startJVM()` reports JVM 21;
  `vscode` can `pip install` further packages; the README's `.venv` flow still works.
- `podman run alpine …` works; `podman build` with a `RUN` step that downloads over HTTPS works.
- `devcontainer up` runs the `postStartCommand` (*"Podman API running at …"*); `DOCKER_HOST` is set;
  `/_ping` returns `OK`; `podman run -d -p 18123:80 nginx` then `curl localhost:18123` → HTTP 200.
- `./mvnw -pl plugin/clickhouse-plugin test` (after `-am install -DskipTests`): Testcontainers
  connects via `DOCKER_HOST`, pulls and starts `clickhouse/clickhouse-server`, 12 suites,
  137 tests succeeded, 0 failed, 0 aborted, `BUILD SUCCESS`.

Failures observed (and fixed) along the way, for reference when diagnosing similar issues:

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Previous attempts to find a Docker environment failed` | No Docker-API socket | `start-podman-service.sh` + `DOCKER_HOST` |
| `pasta failed … Failed to open() /dev/net/tun` | tun device not passed in | `--device=/dev/net/tun` |
| `netavark: nftables error: unable to execute nft` | `nft` binary missing | `nftables` package |
| `crun: mount proc to proc: Operation not permitted` | `/proc` masked in the outer container | `--security-opt=systempaths=unconfined` |
| SDKMAN *"The archive was corrupt"* for Scala 2.13.10 | Stale/broken candidate | Install Scala 3.3.8 |

---

## Limitations and risks

- **Reduced isolation.** The `runArgs` (`SYS_ADMIN`, unconfined seccomp/AppArmor/SELinux, unmasked
  `/proc`) make the dev container meaningfully less isolated from the host than a default
  container. This is the price of nested containers; it is still narrower than `--privileged`.
- **No Ryuk.** If a test run is killed mid-way, Testcontainers' containers may be left running.
  Clean up with `podman rm -f -a` inside the dev container.
- **Untested host configurations.** Docker Engine/Docker Desktop as host engine, Linux hosts with
  SELinux enforcing, IntelliJ's Dev Containers plugin, and VS Code's *Clone Repository in Container
  Volume* flow (which must resolve `${localWorkspaceFolder}` for the extra build context) have not
  been verified.
- **Build-time requirements.** `/opt/venv` reflects `requirements.txt` as of the last image build.
- **Floating versions.** Node/npm track `latest` and will change between rebuilds; Python and
  Podman track Debian trixie. Maven and Scala are pinned.
- **`hostRequirements`** in `devcontainer.json` (2 CPUs, 12 GB memory, 32 GB storage) is advisory
  for local engines; it is enforced by hosted environments such as Codespaces.

## Maintenance

- **Maven:** bump in `install-sdk-packages.sh` together with `.mvn/wrapper/maven-wrapper.properties`.
- **Scala:** keep `install-sdk-packages.sh` in step with `vuu.scala.version` in the root `pom.xml`.
- **JDK:** change the base image tag (`java:<version>-trixie`) in line with CI's `java-version`.
- **Node/npm:** pin by replacing `latest` in the `node:2` feature options if reproducibility is
  needed.

## Addendum — TLS cert for the example servers on 127.0.0.1

**Status: Implemented and verified end-to-end** (`devcontainer up` → cert generated → `SimulMain`
started → `curl --cacert <generated cert> https://127.0.0.1:8443` → HTTP 200; same for
`https://localhost:8443`; `openssl s_client -verify_ip 127.0.0.1` against WSS on 8090 →
`Verify return code: 0 (ok)`).

### Problem

`SimulMain` (`example/main`) serves HTTPS on 8443 and WSS on 8090 using the PEM files committed at
`example/main/src/main/resources/certs/{cert,key}.pem`. That cert has `CN=localhost` and **no
subject alternative names**, so browsers and TLS clients reject it for `https://127.0.0.1` (and
modern browsers ignore the CN, so they reject it for `localhost` too).

### Design

- **Generation:** `generate-dev-certs.sh` (copied to `/usr/local/bin/`) runs as a second
  `postStartCommand` entry (object form, so it runs alongside `start-podman-service.sh`). It uses
  `openssl req -x509` to create an RSA-2048, SHA-256, self-signed server cert with:
  - SANs `DNS:localhost`, `IP:127.0.0.1`, `IP:::1`
  - `basicConstraints=CA:FALSE`, `keyUsage=digitalSignature,keyEncipherment`,
    `extendedKeyUsage=serverAuth`
  - 825 days validity — the longest macOS/iOS accept for a trusted TLS server cert
  - an unencrypted PKCS#8 key (`chmod 600`), which Vert.x's `PemKeyCertOptions` reads directly
- **Idempotent:** an existing cert is kept unless it is missing, expires within 30 days, or lacks
  the `127.0.0.1` SAN, so a browser exception or OS trust added for it survives container restarts
  and rebuilds. `--force` regenerates unconditionally.
- **Location:** `${containerWorkspaceFolder}/.devcontainer/certs/` — inside the workspace so it can
  be imported into the host's trust store, and **gitignored** so generated keys are never
  committed. `openssl` is installed explicitly in the image.
- **Wiring:** `devcontainer.json`'s `containerEnv` sets `VUU_CERT_PATH` / `VUU_KEY_PATH` to those
  files. `SimulMain` resolves each path as *env var if set and non-empty, else the existing
  `vuu.certPath` / `vuu.keyPath` from `application.conf`* (`EnvVars` + `createSsl` in
  `SimulMain.scala`), and both the HTTP/2 server and the websocket server use it. Outside the dev
  container nothing is set, so behaviour is unchanged and the committed certs are used.

### Alternatives considered

| Alternative | Outcome |
|-------------|---------|
| Hard-code the dev-container path in `SimulMain.scala` | Rejected: breaks `SimulMain` everywhere outside the dev container. |
| Overwrite the committed `example/main/.../certs/*.pem` on start | Rejected: dirties the working tree on every start and risks committing generated keys. |
| `vuu.certPath = ${?VUU_CERT_PATH}` in `application.conf` | Would also work; resolving in `SimulMain` was chosen to keep the override explicit in code. |
| Regenerate on every start | Rejected: would invalidate any browser/OS trust each time. |
| A local CA (e.g. mkcert) | Not needed for a dev-only self-signed cert; would add a tool and a CA key to manage. |

### Scope

Only `SimulMain` reads the env vars. `example/main-java` (`VuuExampleMain`),
`example/main-clickhouse` (`ClickHouseMain`) and `example/python-integration` (`start_server.py`)
still use their committed certs; they could adopt the same `VUU_CERT_PATH`/`VUU_KEY_PATH` override
if needed.

## User documentation

`.devcontainer/README.md` is the user-facing guide: prerequisites (Docker or Podman on the host),
VS Code and IntelliJ set-up, what's included, using Podman/Testcontainers inside the container,
and troubleshooting.
