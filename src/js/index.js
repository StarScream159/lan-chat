'use strict';
/*

app starts
1. open port and store value
2. scan ports to see if there is anyone with the banner "lanchat"
3. reply to any that respond saying that we are now online and our port number
4. store reply as a client that is connectable

ongoing every 5 minutes
1. ping clients in list to see if they are still online

app closed
1. send going offline message to all clients in list

*/

// [{ip: 192.168.1.2, port: '27948', hostname: 'Computer1', version: '0.1.0'}, ...]
let clientList = [];