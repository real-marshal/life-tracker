#!/bin/bash

echo "Polling started"

while true; do
    adb shell "run-as com.realmarshal.lumex.dev cat ./files/SQLite/main.db" > device.db

    sleep 2
done
