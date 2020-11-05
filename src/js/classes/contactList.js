var os = require("os");
var net = require('net');
var evilscan = require('evilscan');

class contactList {

  constructor(){
		this.contacts = [];
  }
  
  addContact(c){
		var contact = new Contact(c.ip, c.port, c.host, c.version, true);
		contact.addToInterface();
		this.contacts.push(contact);
	}

	findById(id) {
		return this.contacts.find(o => o.id === id);
	}
  
}