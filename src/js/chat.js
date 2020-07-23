'use strict';
const appSettings  = require('electron-settings');

var os = require("os");
var net = require('net');
var evilscan = require('evilscan');

function getLocalIP() {
	var ifaces = os.networkInterfaces();
	var localip;
	Object.keys(ifaces).forEach(function (ifname) {
		var alias = 0;
		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return;
			}

			if (alias >= 1) {
				// this single interface has multiple ipv4 addresses
				localip = iface.address;
			} else {
				// this interface has only one ipv4 adresss
				// ifname Ethernet/Wifi/etc
				// iface.address = ip address
				localip = iface.address;
			}
			++alias;
		});
	});

	return localip;
}

function getLocalCIDR() {
	var ipParts = getLocalIP().split('.');
	ipParts[3] = 0;
	return ipParts.join('.') + '/24';
}

function findOtherClients() {
	console.log('scanning ' + getLocalCIDR());
	var options = {
		target: getLocalCIDR(),
		port: '27948',
		status:'O', // (T)imeout, (R)efused, (O)pen, (U)nreachable
		banner:true,
		concurrency: 1000,
		timeout: 1000
	};
	var scanner = new evilscan(options);
	scanner.on('result',function(data) {
		if (data.ip != getLocalIP()) {
			var banner = data.banner;
			if (banner != '') {
				var banner = banner.split(";");
				if (banner[0] == 'lan-chat') {
					console.log('found chat at ' + banner[2] + '@' + data.port);
					var client = {
						ip: data.ip,
						port: data.port,
						host: banner[2],
						version: banner[1]
					}
					clientList.push(client);
				}
			}
		}
	});
	scanner.on('error',function(err) {
		throw new Error(data.toString());
	});
	scanner.on('done',function() {
		console.log('scanner done');
	});
	scanner.run();
}
findOtherClients();


function openServer() {
	var HOST = '0.0.0.0';
	var PORT = 27948;
	
	net.createServer(function(sock) {
		sock.write(require('electron').remote.app.getName()+';'+require('electron').remote.app.getVersion()+';'+os.hostname());
		// We have a connection - a socket object is assigned to the connection automatically
		console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);

		// Add a 'data' event handler to this instance of socket
		sock.on('data', function(data) {
			console.log('DATA ' + sock.remoteAddress + ': ' + data);
			// Write the data back to the socket, the client will receive it as data from the server
			sock.write('You said "' + data + '"');
		});

		// Add a 'close' event handler to this instance of socket
		sock.on('close', function(data) {
			console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
		});
	
	}).listen(PORT, HOST);
	console.log('Server listening on ' + HOST +':'+ PORT);
}
openServer();