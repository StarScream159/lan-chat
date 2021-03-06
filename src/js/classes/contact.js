var net = require('net');
const { runInThisContext } = require('vm');

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
		this.avatar = this.getRandomColor();
		this.status = 'online';
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
		html += '		<div class="avatar online" style="background: '+ this.avatar +'"><span>'+ this.getInitial() +'</span></div>';
		//html += '		<img src="https://i.pravatar.cc/300" alt="">';
		html += '   <div class="unread"><span>0</span></div>';
		html += '		<div class="meta">';
		html += '			<p class="name">'+ this.host +'</p>';
		html += '			<p class="preview">'+ this.ip +'</p>';
		html += '		</div>';
		html += '	</div>';
		html += '</li>';
		$('#contacts > ul').append(html);
	}

	removeFromInterface() {
		if (this.id === ContactList.findCurrent().id) {
			$('.messages > ul').empty();
			$('.messages').find('.no-messages').fadeIn();
		}
		$('*[data-uuid="'+ this.id +'"]').remove();
	}

	removeFromStack() {
		ContactList.removeById(this);
	}

	removeContact() {
		this.disconnectConnection();
		this.removeFromInterface();
		this.removeFromStack();
	}
	
	messageSend(message) {
		this.sock.write(JSON.stringify({payload: 'msg', source: getLocalHost(), message: message}));
	}

	messageAppend(message) {
		this.messages.push(message);
		// if we are active on this contact, append it to the screen
		// otherwise increase unread count and it'll be loaded on click
		if ($('*[data-uuid="'+ this.id +'"]').hasClass('active')) {
			var scroll = false;	// only scroll if we are already at the bottom
			if($('.messages').scrollTop() + $('.messages').innerHeight() >= $('.messages')[0].scrollHeight) {
				scroll = true;
			}

			$('.messages').find('.no-messages').hide();
			var html = message.messageMarkup();
			$('.messages > ul').append(html);

			if (scroll) {
				$('.messages').animate({scrollTop: $('.messages')[0].scrollHeight}, 'fast');
			}else{
				$('.scroll-notification').fadeIn('fast');
			}
		}else{
			this.unread++;
			this.updateUnread();
		}
	}

	updateStatus(status) {
		// strings: online, away, busy, offline
		this.status = status;
		$('*[data-uuid="'+ this.id +'"]').find('.contact-status').removeClass('online offline away busy').addClass(status);
		if (status === 'offline' && this.id === ContactList.findCurrent().id) {
			// disable the message submit
			disableMessaging('Contact is offline.');
		}else if(status !== 'offline' && this.id === ContactList.findCurrent().id) {
			enableMessaging();
		}
	}

	updateUnread() {
		$('*[data-uuid="'+ this.id +'"]').find('.unread').show().find('span').text(this.unread);
	}

	clearUnread() {
		this.unread = 0;
		$('*[data-uuid="'+ this.id +'"]').find('.unread').hide();
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
		});

		sock.on('end', function() {
			console.log('ending');
			that.updateStatus('offline');
			that.disconnectConnection();
		});

		sock.on('error', function(e) {
			//console.log(e);
			sock.destroy();
		});

		that.sock = sock;
	}

	disconnectConnection() {
		this.sock.end(JSON.stringify({payload: 'goodbye', source: getLocalHost(), message: ''}));
		this.sock.destroy();
	}

	loadMessages() {
		$('.contact-profile > p').text(this.host);
		$('.contact-profile > .avatar').css('background', this.avatar).find('span').text(this.getInitial());
		$('.messages > ul').empty();
		if (this.messages.length === 0) {
			$('.messages').find('.no-messages').fadeIn();
		}else{
			$('.messages').find('.no-messages').fadeOut();
			var i;
			for(i=0;i < this.messages.length;i++) {
				var message = this.messages[i];
				var html = message.messageMarkup();
				$('.messages > ul').append(html);
			}
			this.clearUnread();
		}
	}

	getRandomColor() {
		var length = 6;
		var chars = '0123456789ABCDEF';
		var hex = '#';
		while(length--) hex += chars[(Math.random() * 16) | 0];
		while(!ContactList.uniqueColor(hex)) {
			this.getRandomColor();
		}
		return hex;
	}

	getInitial() {
		return this.host.substring(0,1);
	}

}