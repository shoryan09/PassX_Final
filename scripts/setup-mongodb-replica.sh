#!/bin/bash

echo "🔧 Setting up MongoDB as a replica set for development..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    mongod --config /tmp/mongod-replica.conf --fork --logpath /tmp/mongod.log 2>&1
    sleep 3
fi

# Initialize replica set if not already initialized
REPLICA_STATUS=$(mongosh --eval "rs.status().ok" --quiet 2>/dev/null)

if [ "$REPLICA_STATUS" != "1" ]; then
    echo "Initializing replica set..."
    mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})" --quiet
    sleep 3
    echo "✅ Replica set initialized"
else
    echo "✅ Replica set already initialized"
fi

# Verify status
STATUS=$(mongosh --eval "rs.status().members[0].stateStr" --quiet 2>/dev/null)
echo "Replica set status: $STATUS"

