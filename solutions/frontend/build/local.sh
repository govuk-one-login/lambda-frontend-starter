#!/bin/bash

set -e

bash ./build/shared.sh

# Bundle JavaScript
rolldown -c rolldown.local.config.ts

ln -s "${PWD}/../../node_modules" ./dist/node_modules