const {clipboard} = require('electron');
var validUrl = require('valid-url');

class Message {
	constructor(data, remoteAddress) {
		var data = JSON.parse(data);

		this.sender = remoteAddress;
		this.payload = data.payload;
		this.source = data.source;
		this.message = data.message;
		this.data = data;	// raw data incase we need it later or something
	}

	decodeMessage(message) {
		return JSON.parse(message);
	}

	senderSelf() {
		return this.sender === getLocalHost().ip;
	}

	isLinkOnly() {
		return typeof validUrl.isWebUri(this.message) !== "undefined";
	}

	pushToClipboard() {
		clipboard.writeText(this.message);
		if (appSettings.has('chat.Settings')) {
			var chatSettings = appSettings.get('chat.Settings');
			if (chatSettings.clipBoardNotifications) {
				this.sendSysNotification('Link copied to the clipboard.');
			}
		}
	}

	sendSysNotification(title) {
		var myNotification = new Notification('LAN Chat', {
			subtitle: title,
			body: this.message,
			icon: './img/icons/png/128x128.png',
			silent: true,
		});
	}

	parseMessage() {
		var payload = this.payload;
		switch(payload) {
			case 'hello':
				var contact = new Contact(this.source.ip, this.source.port, this.source.host, this.source.version, false);
				var clc = ContactList.findById(contact.id);
				if (clc instanceof Contact) { 
					if (clc.port !== contact.port) {
						clc.updatePort(contact.port);
					}
					clc.updateStatus('online');
					clc.setupConnection(false);
				}else{
					ContactList.addContact(contact);
				}
				contact = null; // trashman
				break;

			case 'msg':
				// new incoming text message
				var contact = new Contact(this.source.ip, this.source.port, this.source.host, this.source.version, false);
				var clc = ContactList.findById(contact.id);
				if (clc instanceof Contact) {
					this.source = clc;
					clc.messageAppend(this);
					if (appSettings.has('chat.Settings')) {
						var chatSettings = appSettings.get('chat.Settings');
						if (chatSettings.clipBoardLinks) {
							if (this.isLinkOnly()) {
								this.pushToClipboard();
							}
						}
					}
				}
				contact = null; // trashman
				break;
				
			case 'goodbye':
				var contact = new Contact(this.source.ip, this.source.port, this.source.host, this.source.version, false);
				var clc = ContactList.findById(contact.id);
				clc.removeContact();
				break;
		}
	}

	getMessageSourceAvatar() {
		if (this.senderSelf()) {
			return '#512DA8';
		}else{
			if (this.source instanceof Contact) {
				return this.source.avatar;
			}
			return '#000';	// black default?? this should never happen anyways
		}
	}

	getMessageSourceInitial() {
		if (this.senderSelf()) {
			return localHost.hostname.substring(0,1);
		}else{
			if (this.source instanceof Contact) {
				return this.source.getInitial();
			}
			return 'L';
		}
	}

	messageMarkup() {
		var html = '<li class="'+ (this.senderSelf()?'sent':'replies') +'">';
		html += '	<div class="avatar" style="background:'+this.getMessageSourceAvatar()+'"><span>'+this.getMessageSourceInitial()+'</span></div>';
		html += ' <p>'+Message.makeMarkupLinksClickable(this.message)+'</p>';
		html += '</li>';
		return html;
	}

	static makeMarkupLinksClickable(html) {
		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return html.replace(exp,"<a href='$1' class='external'>$1</a>"); 
	}
}