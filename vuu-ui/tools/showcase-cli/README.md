# Showcase CLI

## startup sequence

#### cli.mjs

- load index.html from templates
- get config file from input args, default to 'showcase.config.json'
- check config file exists
- check ./.showcase folder exists
  if not - create ./.showcase - copy index.html to .showcase
  if ../dist folder exists (this will be part of published package) - copy build files from ../dist to .showcase
- read config json from config file
- validate that directory exists at `config.exhibits`
- build exhibit structure from files at `config.exhibits`
- write the packageTree structure out to .showcase
- call (main.ts).start(config)

## Next steps

- once package tree is created, creat import maps
- inject importmaps into index.html
- update Tree to allow runtime node expansion
- update showcase-standalone

- integrate into vuu cli, using stricli. Parameter parsing will happen there
- use jumpgen to monitor file system for new/edited exhibits in dev mode
