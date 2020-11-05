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

	parseMessage() {
		var payload = this.payload;
		switch(payload) {
			case 'hello':
				var contact = new Contact(this.source.ip, this.source.port, this.source.host, this.source.version, false);
				var clc = ContactList.findById(contact.id);
				if (typeof clc !== "undefined") {
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
				if (typeof clc !== "undefined") {
					clc.messageAppend(this);
				}
				contact = null; // trashman
				break;
		}
	}
}