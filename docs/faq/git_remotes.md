# Working on other people's Git remotes

```bash
# change forkname for the fork you want to use
git remote add <forkname> https://github.com/<forkname>/vuu.git

# check remote has been added
git remote -v

# fetch the remote
git fetch <forkname>

# check out the branch
git checkout -b <branchname> --track <forkname>/<branchname>

```
## Merging into your local working branch 

(make sure you're checked out on your working branch and that you've already added their remote and fetched as above)
```bash
git merge <forkname>/<branchname>
```

