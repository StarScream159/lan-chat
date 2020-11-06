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

const appSettings  = require('electron-settings');
const customTitlebar = require('custom-electron-titlebar');

var os = require("os");
var net = require('net');
var evilscan = require('evilscan');
var portfinder = require('portfinder');

let localHost = {'id': '', 'hostname': '', 'ip': '', 'port': 0};
let messagingEnabled = true;
const ContactList = new contactList();

new customTitlebar.Titlebar({
	backgroundColor: customTitlebar.Color.fromHex('#2C3E50'),
	overflow: 'hidden'
});

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

function setLocalHost() {
	localHost.hostname = os.hostname();
	localHost.ip = getLocalIP();

	$(".localHost-hostname").text(localHost.hostname);
	$(".localHost-ip").text(localHost.ip);
	$(".localHost-hostnameShort > span").text(localHost.hostname.substring(0,1));
}
setLocalHost();

function getLocalHost() {
	return {'ip': localHost.ip, 'port': localHost.port, 'host': localHost.hostname, 'version': require('electron').remote.app.getVersion()};
}
getLocalHost();

function findOtherClients() {
	console.log('scanning ' + getLocalCIDR());
	var options = {
		target: getLocalCIDR(),
		port: '27900-27925', // 0-65535 but 27948 default
		status:'O', // (T)imeout, (R)efused, (O)pen, (U)nreachable
		banner: true,
		concurrency: 1000,
		timeout: 1000
	};

	if (appSettings.has('chat.Scanner')) {
		//options.port = appSettings.get('chat.Settings').port;	// TODO: allow users to set a port in the options
		options.concurrency = appSettings.get('chat.Scanner').concurrency;
		options.timeout = appSettings.get('chat.Scanner').timeout;
	}

	var scanner = new evilscan(options);
	scanner.on('result',function(data) {
		if (data.ip != getLocalIP()) {
			var banner = data.banner;
			if (banner != '') {
				var banner = banner.split(";");
				if (banner[0] == 'lan-chat') {
					//console.log('found chat at ' + banner[2] + ':' + data.port);
					var client = {
						ip: data.ip,
						port: data.port,
						host: banner[2],
						version: banner[1]
					}
					ContactList.addContact(client);
				}
			}
		}
	});
	scanner.on('error',function(err) {
		throw new Error(data.toString());
	});
	scanner.on('done',function() {
		console.log('scanning finished');
		// scanner is done		
	});
	scanner.run();
}
findOtherClients();

function openServer(err, port) {
	var options = {
		host: '0.0.0.0',
		port: port,
	};

	if (appSettings.has('chat.Settings')) {
		options.host = appSettings.get('chat.Settings').host;
		//options.port = appSettings.get('chat.Settings').port;	// just use a random port that is found each time - TODO: allow users to set a port in the options
	}
	
	var srv = net.createServer(function(sock) {
		sock.write(require('electron').remote.app.getName()+';'+require('electron').remote.app.getVersion()+';'+os.hostname());
		// We have a connection - a socket object is assigned to the connection automatically
		console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);

		// Add a 'data' event handler to this instance of socket
		sock.on('data', function(data) {
			var buff = Buffer.from(data);
			if (Buffer.isBuffer(buff)) {
				var message = new Message(buff.toString('utf-8'), sock.remoteAddress);
			}else{
				var message = new Message(data, sock.remoteAddress);
			}
			message.parseMessage();
		});

		// Add a 'close' event handler to this instance of socket
		sock.on('close', function(data) {
			console.log('DISCONNECTED: ' + sock.remoteAddress +' '+ sock.remotePort);
		});

		sock.on('error', function(e) {
			//console.log(e);
		});
	
	});
	srv.listen(options.port, options.host, function() {	// TODO: catch on error if the port is in use
		console.log('Server listening on port ' + srv.address().port);
		appSettings.set('chat.Settings.port', srv.address().port);
		localHost.port = srv.address().port;
	});
}

// start us up
portfinder.getPort({
	port: 27900,    // minimum port
	stopPort: 27925 // maximum port
}, openServer);

function newMessageSend() {
	var message = new Message(JSON.stringify({payload:'msg', source: getLocalHost(), message: $('.message-input input').val()}), getLocalHost().ip);
	var clc = ContactList.findCurrent();
	if (clc instanceof Contact) {
		clc.messageSend($('.message-input input').val());
		clc.messageAppend(message);

		$('.message-input input').val('');
	}
	clc = null; // trashman
}

function disableMessaging(message) {
	messagingEnabled = false;
	$('.message-input input').addClass('disabled').attr('placeholder', message).prop('readonly', true);
	$('.message-input button').addClass('disabled').prop('disabled', true);
}
disableMessaging(); // start us off disabled, since the app starts with no contacts

function enableMessaging() {
	messagingEnabled = true;
	$('.message-input input').removeClass('disabled').attr('placeholder', 'Write your message...').prop('readonly', false);
	$('.message-input button').removeClass('disabled').prop('disabled', false);
}