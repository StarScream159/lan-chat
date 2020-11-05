class Message {
	constructor(data, remoteAddress) {
		var data = JSON.parse(data);

		this.sender = remoteAddress;
		this.payload = data.payload;
		this.message = data.message;
		this.data = data;	// raw data incase we need it
	}

	decodeMessage(message) {
		return JSON.parse(message);
	}

	parseMessage() {
		var payload = this.payload;
		switch(payload) {
			case 'hello':
				// new client, maybe... check our ContactList and add it if it is new
				// 1. hash the url
				// 2. search ContactList for the hash
				// 3. if found, update status for it - new port maybe?
				// 4. if not found, add it like the scanner

				var contact = new Contact(this.message.ip, this.message.port, this.message.host, this.message.version, false);
				var clc = ContactList.findById(contact.id);
				if (typeof clc !== "undefined") {
					if (clc.port !== contact.port) {
						clc.updatePort(contact.port);
					}
					clc.updateStatus('online');
				}else{
					ContactList.addContact(contact);
				}
				break;
		}
	}
}