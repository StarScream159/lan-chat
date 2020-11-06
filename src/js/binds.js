// app binds
const { shell } = require('electron')

// contact list
$('#contacts').on('click', '.contact:not(.active)', function() {
	$('.contact-profile').fadeIn('fast');
	$('#contacts').find('.contact').removeClass('active');
	$(this).addClass('active');
	
	var clc = ContactList.findById($(this).data('uuid'));
	if (clc instanceof Contact) {
		clc.loadMessages();

		if (clc.status === 'offline') {
			disableMessaging('Contact is offline.');
		}else{
			enableMessaging();
		}
	}

	clc = null // trashman
});

// messaging
$('.submit').click(function() {
	var message = $('.message-input input').val();
	if (message.trim() !== '' && messagingEnabled)
		newMessageSend();
});

$(window).on('keydown', function(e) {
	var message = $('.message-input input').val();
  if (e.which == 13 && message.trim() !== '' && messagingEnabled) {
    newMessageSend();
    return false;
  }
});

$('.messages').on('click', 'a.external', function(evt) {
	evt.preventDefault();
	shell.openExternal($(this).attr('href'));
});