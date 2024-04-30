### Vuu setup using Devcontainers

#### Prerequisites
1. Have `Docker` installed and running.

---

#### Set-up for VS Code
1. Install `Dev Containers` extension: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
2. Press `F1` -> Select `Dev Containers: Clone Repository in Container Volume...`
3. Use `Vuu` repository url: `https://github.com/finos/vuu.git`

---

#### Set-up for IntelliJ (only works with Ultimate Edition)
1. Enable `Dev Containers` plugin: https://plugins.jetbrains.com/plugin/21962-dev-containers
2. Open `IntelliJ UE` -> `Remote Development` -> `Dev Containers` -> `New Dev Container` <img width="700" alt="Screenshot 2024-04-14 at 9 02 07 PM" src="https://github.com/finos/vuu/assets/62522218/e030687a-d67b-4815-becc-6b6ce0f8a161"/>
3. Add `Git Repository`: `https://github.com/finos/vuu.git` & `Git Branch`: `main`
4. Click on `Build Container and Continue` button. Now it will clone the source code, build the image and create/configure your dev container.
5. Follow the on-screen instructions to start up the IntelliJ client.
6. Download Scala plugin and restart your IntelliJ to apply the newly installed plugin. The IDE client might not start automatically in that case just open the already created devcontainer. You can see the list of created dev containers from the screen in step 1.
7. Set your Scala SDK (you should already have Scala installed in your env):  `Project Structure` -> `Global Libraries` -> `Add using + icon` -> `Scala SDK` -> `Select the one already installed` -> `OK`
8. Refresh your maven project (https://stackoverflow.com/a/63022272)

**In case clone fails to pull the whole project**
1. Open terminal on your IntelliJ
2. Run the following command:
```bash
  # might have to remove the existing files/folders inside vuu/
  git clone https://github.com/finos/vuu.git .
```

---