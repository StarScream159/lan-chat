var net = require('net');

class Contact {
  constructor(ip, port, host, version) {
		// [{ip: 192.168.1.2, port: '27948', host: 'Computer1', version: '0.1.0', messages: []}, ...]
		this.id = this.generateHash(host + ip);
    this.ip = ip;
		this.port = port;
		this.host = host;
		this.version = version;
		this.messages = [];
		this.sock = null;
		this.setupConnection();
	}

	generateHash(text) {
		var hash = 0;
		if (text.length == 0) {
			return hash;
		}
		for (var i = 0; i < text.length; i++) {
			var char = text.charCodeAt(i);
			hash = ((hash<<5)-hash)+char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}

	addToInterface() {
		var html = '<li class="contact" data-uuid="'+ this.id +'">';
		html += '	<div class="wrap">';
		html += '		<span class="contact-status online"></span>';
		html += '		<img src="https://i.pravatar.cc/300" alt="">';
		html += '		<div class="meta">';
		html += '			<p class="name">'+ this.host +'</p>';
		html += '			<p class="preview">'+ this.ip +'</p>';
		html += '		</div>';
		html += '	</div>';
		html += '</li>';
		$('#contacts > ul').append(html);
	}

	removeFromInterface() {
		$('*[data-uuid="'+ this.id +'"]').remove();
	}
	
	messageSend(message) {
		sock.write(JSON.stringify({payload: 'msg', message: message}));
	}

	messageGet() {
		//
	}

	updateStatus(status) {
		// strings: online, away, busy, offline
		$('*[data-uuid="'+ this.id +'"]').find('.contact-status').removeClass('online offline away busy').addClass(status);
	}

	setupConnection() {
		var that = this;
		var sock = new net.Socket();

		sock.connect(that.port, that.ip, function() {
			sock.write(JSON.stringify({payload: 'ping', id: that.id, message: ''}));
		});

		sock.on('close', function() {
			that.updateStatus('offline');
		});

		sock.on('error', function(e) {
			//console.log(e);
			sock.destroy();
		});

		that.sock = sock;
	}

	disconnectConnection() {
		this.sock.destroy();
	}

	loadMessages() {
		//
	}

}