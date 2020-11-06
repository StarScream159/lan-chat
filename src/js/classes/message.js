const {clipboard} = require('electron');
var validUrl = require('valid-url');

class Message {
	constructor(data, remoteAddress) {
		var data = JSON.parse(data);

		this.sender = remoteAddress;
		this.payload = data.payload;
		this.source = data.source;
		this.message = data.message;
		this.data = data;	// raw data incase we need it
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
					clc.messageAppend(this);
					if (appSettings.has('chat.Settings')) {
						var chatSettings = appSettings.has('chat.Settings');
						var clipBoardLinks = chatSettings.clipBoardLinks;
						if (clipBoardLinks || 1) { // TODO: add this as a setting so it can be turned off
							if (this.isLinkOnly()) {
								this.pushToClipboard();
							}
						}
					}
				}
				contact = null; // trashman
				break;
		}
	}

	messageMarkup() {
		var html = '<li class="'+ (this.senderSelf()?'sent':'replies') +'">';
		html += '	<img src="https://i.pravatar.cc/300?img=19" alt="" />';
		html += ' <p>'+Message.makeMarkupLinksClickable(this.message)+'</p>';
		html += '</li>';
		return html;
	}

	static makeMarkupLinksClickable(html) {
		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return html.replace(exp,"<a href='$1'>$1</a>"); 
	}
}