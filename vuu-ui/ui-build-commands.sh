#!/bin/bash
echo ">>>Running UI Build"
echo "Path is:" + $PWD
echo "NPM output below"
npm
npm run build
npm run build:app
echo "listing files post build"
ls -R -lisa
