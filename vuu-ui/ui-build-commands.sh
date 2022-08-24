#!/bin/bash
echo "Path is:" + $PWD
yarn
yarn build
yarn build:app
