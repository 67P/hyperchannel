#!/bin/sh
set -xe

# Get revision from local master
rev=`git rev-parse HEAD`
short_rev=${rev:0:7}
# Check out build branch
git checkout build-production
# Copy from build dir to root
cp -r dist/* .
# Add all files
git add --all
# Commit build files
git commit -m "Build production from $short_rev"
# Push to remote
git push 5apps build-production:master
# Push build branch to collab repo
git push origin build-production:build-production
# Go back to previous branch
git checkout -
