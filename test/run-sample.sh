#!/bin/bash

docker build -t ncoif/sample-webapp:1.0.0 .
docker run -p 8080:8080 ncoif/sample-webapp:1.0.0
