#!/usr/bin/env bash

DEBUG="question-game" node server/server.js -w client/target/dist/ -q questions1.fr.json -c 1
