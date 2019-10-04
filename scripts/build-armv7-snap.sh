#!/bin/bash
set -e

teg_VERSION=`node -e "console.log(require('./packages/teg-core/package.json').version);"`;
echo "\e[32mSnapping Teg $teg_VERSION for armv7:\e[0m Ignore the warnings and scary yellow text. This is not a pretty process.\n"
USER=`whoami`

echo "Remotely building Teg"
ssh $teg_ARMV7_HOST -p $teg_ARMV7_PORT 'cd teg && nvm use && git checkout master && git pull origin master && yarn bootstrap && yarn build-dev && yarn pkg:build && yarn tegmarlin:build'
echo "Remotely building Teg [DONE]"

cd ./snap

rm -rf ./node_modules
snapcraft clean
snapcraft clean teg -s pull

sed -i -E "s/version:[^\n]+/version: $teg_VERSION/g" ./snapcraft.yaml
sed -i -E "s/run-on:[^\n]+/run-on: armhf/g" ./snapcraft.yaml

rsync -e "ssh -p $teg_ARMV7_PORT" --chown=$USER:$USER -a --include="*.node" --include="*/" --exclude="*" --prune-empty-dirs $teg_ARMV7_HOST:~/teg/node_modules ./
rsync -e "ssh -p $teg_ARMV7_PORT" --chown=$USER:$USER -a $teg_ARMV7_HOST:~/teg/snap/teg ./

snapcraft

mv ./*.snap ../dist/armhf.snap

echo "\n\nBUILD COMPLETE (don't worry about the warnings and yellow text they are probably fine)"
