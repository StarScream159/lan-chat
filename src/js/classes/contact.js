var net = require('net');

class Contact {
  constructor(ip, port, host, version, autoConnect) {
		// [{ip: 192.168.1.2, port: '27948', host: 'Computer1', version: '0.1.0', messages: []}, ...]
		this.id = this.generateHash(host + ip);
    this.ip = ip;
		this.port = port;
		this.host = host;
		this.version = version;
		this.messages = [];
		this.unread = 0;
		this.sock = null;
		if (autoConnect) {
			this.setupConnection(true);
		}
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
		this.sock.write(JSON.stringify({payload: 'msg', source: getLocalHost(), message: message}));
	}

	messageAppend(message) {
		this.messages.push(message);
		// if we are active on this contact, append it to the screen
		// otherwise increase unread count and it'll be loaded on click
		if ($('*[data-uuid="'+ this.id +'"]').hasClass('active')) {
			console.log('append to screen');
		}else{
			console.log('increase unread');
			this.unread++;
			this.updateUnread();
		}
	}

	updateStatus(status) {
		// strings: online, away, busy, offline
		$('*[data-uuid="'+ this.id +'"]').find('.contact-status').removeClass('online offline away busy').addClass(status);
	}

	updateUnread() {
		$('*[data-uuid="'+ this.id +'"]');
	}

	updatePort(port) {
		this.disconnectConnection();
		this.port = port;
		this.setupConnection(false);
	}

	setupConnection(notify) {
		var that = this;
		var sock = new net.Socket();

		sock.connect(that.port, that.ip, function() {
			if (notify) {
				sock.write(JSON.stringify({payload: 'hello', source: getLocalHost(), message: ''}));
			}
		});

		sock.on('close', function() {
			that.updateStatus('offline');
			this.sock.destroy();
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
		$('.contact-profile > p').text(this.host);
		$('.messages > ul').empty();
		if (this.messages.length === 0) {
			$('.messages').find('.no-messages').fadeIn();
		}else{
			$('.messages').find('.no-messages').fadeOut();
			var i;
			for(i=0;i < this.messages.length;$i++) {
				var html = '<li class="'+ (this.message.senderSelf()?'sent':'reply') +'">';
				html += '	<img src="https://i.pravatar.cc/300?img=19" alt="" />';
				html += ' <p>'+message.message+'</p>';
				html += '</li>';
				$('.messages > ul').append(html);
			}
		}
	}

}