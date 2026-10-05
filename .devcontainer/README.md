### Vuu setup using Devcontainers

The dev container gives you everything needed to build and run Vuu, including the parts of the
build that start their own containers (the `clickhouse-plugin` tests). For the full design and the
reasoning behind it, see [`docs/rfc/devcontainer.md`](../docs/rfc/devcontainer.md).

#### What's included

| Tool    | Version |
|---------|---------|
| JDK     | 21 (the code targets Java 17, so 17-compatible builds still work) |
| Maven   | 3.9.16 (same as `./mvnw`) |
| Scala   | 3.3.8 (same as `vuu.scala.version` in the root `pom.xml`) |
| Node / npm | latest (Node 26 / npm 12 at time of writing) |
| Python  | 3.13, with a venv at `/opt/venv` already on `PATH` and `example/python-integration`'s `requirements.txt` pre-installed |
| Podman  | 5.x, rootless, plus a Docker-compatible API socket for Testcontainers |

#### Prerequisites
1. Have `Docker` or `Podman` installed and running.
   - With Podman on macOS/Windows, the Podman machine must be running (`podman machine start`).
   - The host should have at least 2 CPUs, 12 GB memory and 32 GB storage available to the
     container engine (see `hostRequirements` in `devcontainer.json`).

---

#### Set-up for VS Code
1. Install `Dev Containers` extension: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
2. If you use Podman rather than Docker, set `Dev › Containers: Docker Path` to `podman` in VS Code settings
   (`"dev.containers.dockerPath": "podman"`).
3. Press `F1` -> Select `Dev Containers: Clone Repository in Container Volume...`
4. Use `Vuu` repository url: `https://github.com/finos/vuu.git`

If you already have the repo checked out, you can instead open it and use
`Dev Containers: Reopen in Container`.

---

#### Set-up for IntelliJ (only works with Ultimate Edition)
1. Enable `Dev Containers` plugin: https://plugins.jetbrains.com/plugin/21962-dev-containers
2. Open `IntelliJ UE` -> `Remote Development` -> `Dev Containers` -> `New Dev Container` <img width="700" alt="Screenshot 2024-04-14 at 9 02 07 PM" src="https://github.com/finos/vuu/assets/62522218/e030687a-d67b-4815-becc-6b6ce0f8a161"/>
3. Add `Git Repository`: `https://github.com/finos/vuu.git` & `Git Branch`: `main`
4. Click on `Build Container and Continue` button. Now it will clone the source code, build the image and create/configure your dev container.
5. Follow the on-screen instructions to start up the IntelliJ client.
6. Download Scala plugin and restart your IntelliJ to apply the newly installed plugin. The IDE client might not start automatically in that case just open the already created devcontainer. You can see the list of created dev containers from the screen in step 1.
7. Set your Scala SDK to the Scala 3.3.8 already installed in the container:  `Project Structure` -> `Global Libraries` -> `Add using + icon` -> `Scala SDK` -> select `3.3.8` (installed under `/usr/local/sdkman/candidates/scala/current`) -> `OK`
8. Refresh your maven project (https://stackoverflow.com/a/63022272)

**In case clone fails to pull the whole project**
1. Open terminal on your IntelliJ
2. Run the following command:
```bash
  # might have to remove the existing files/folders inside vuu/
  git clone https://github.com/finos/vuu.git .
```

---

#### Building and testing

Build everything, including the `clickhouse-plugin` tests that start ClickHouse in a container:

```bash
./mvnw install
```

Run the Python integration example (its requirements are already installed in `/opt/venv`):

```bash
cd example/python-integration/python && python start_server.py
```

See [`example/python-integration/README.md`](../example/python-integration/README.md) for the
full steps, including building the module first.

#### HTTPS on 127.0.0.1 (example servers)

Each time the container starts, it makes sure there's a self-signed TLS cert valid for
`https://127.0.0.1`, `https://localhost` and `https://[::1]` at `.devcontainer/certs/cert.pem` and
`.devcontainer/certs/key.pem` (gitignored). The container sets `VUU_CERT_PATH` and
`VUU_KEY_PATH` to these files. When those are set, `SimulMain` uses them for its HTTPS (8443) and
WSS (8090) endpoints instead of the `vuu.certPath`/`vuu.keyPath` defaults in `application.conf`.

The cert is kept across restarts, so a browser exception or trust you've added for it stays valid.
It's regenerated only if it's missing, expires within 30 days, or doesn't cover 127.0.0.1. To
force a new one:

```bash
/usr/local/bin/generate-dev-certs.sh --force
```

Your browser won't trust the cert by default. Either accept the warning, or import
`.devcontainer/certs/cert.pem` into your host's trust store (for example Keychain Access on macOS)
and mark it as trusted.

#### Containers inside the dev container

Podman runs inside the dev container as the `vscode` user, so you can use `podman run`,
`podman build` and so on directly. Images and containers live inside the dev container and are
separate from your host's.

When the container starts, it also starts Podman's Docker-compatible API socket at
`/home/vscode/.podman/podman.sock`. `DOCKER_HOST` points at it, so Testcontainers and other tools
that use the Docker API work without any extra set-up.

To make nested containers work, the dev container runs with extra privileges (see `runArgs` in
`devcontainer.json`). It is therefore less isolated from your host than a default container.

#### Troubleshooting

- **`Previous attempts to find a Docker environment failed`** during a Maven build: the Podman
  API socket isn't running. Start it with:
  ```bash
  /usr/local/bin/start-podman-service.sh
  ```
  If it fails, check `~/.podman/podman-service.log`.
- **Leftover test containers:** Testcontainers' automatic clean-up (Ryuk) is disabled inside the
  dev container, so a test run that's killed part-way can leave containers running. Remove them
  with:
  ```bash
  podman rm -f -a
  ```
- **Changes to `.devcontainer/` or `example/python-integration/python/requirements.txt`** only
  take effect after rebuilding the container (`Dev Containers: Rebuild Container` in VS Code).

---
