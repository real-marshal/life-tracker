#!/bin/bash

echo "Polling started"

while true; do
    adb shell "run-as com.real_marshal.lifetracker cat ./files/SQLite/main.db" > device.db

    sleep 2
done
