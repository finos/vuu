How to release vuu backend code:

Prerequisite:
You need to be a member of @vuu/finos-maintainer

Steps:
1. In [pom.xml](https://github.com/finos/vuu/blob/main/pom.xml), find the current snapshot version, e.g. <version>0.1.23-SNAPSHOT</version>. The next release version is 0.1.23.
2. Go to [Actions](https://github.com/finos/vuu/actions) -> [Deploy to MVN Central](https://github.com/finos/vuu/actions/workflows/release-mvn-central.yml).Click "Run workflow" and manually fill in the release version (0.1.23) and the new snapshot version (0.1.24-SNAPSHOT). Click the green button "Run workflow".
3. Wait for pipeline to finish.
4. Go to [Releases](https://github.com/finos/vuu/releases), click "Draft a new release". Select the tag for this new release, e.g. vuu-parent-0.1.23, fill in Release title, select previous tag for release notes, click Generate release notes. Click "Publish release"
5. In [Branches](https://github.com/finos/vuu/branches), find the branch that's been automatically created to update pom file, e.g. release-0.1.23. Create a pull request and merge it.
