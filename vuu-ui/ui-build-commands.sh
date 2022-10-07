#!/bin/bash
echo ">>>Running UI Build"
echo "Path is:" + $PWD
echo "Yarn output below"
yarn
yarn build
yarn build:app
echo "listing files post build"
ls -R -lisa
