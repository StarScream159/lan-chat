// app binds
const { shell } = require('electron');

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

// single contact
$('.contact-controls').find('.delete-contact').click(function(evt) {
	evt.preventDefault();
	MicroModal.show('delete-confirm-modal');
});
$("#delete-confirm-modal .modal__btn-warning").click(function(evt) {
	evt.preventDefault();
	MicroModal.close('delete-confirm-modal');

	$('.contact-profile').fadeOut('fast');
	disableMessaging();

	var clc = ContactList.findCurrent();
	clc.removeContact();
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

$('body').on('click', 'a.external', function(evt) {
	evt.preventDefault();
	shell.openExternal($(this).attr('href'));
});

$('.messages').on('scroll', function() {
	if ($('.scroll-notification').is(":visible")) {
		if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
			$('.scroll-notification').fadeOut('fast');
		}
	}
});

$('.scroll-notification').click(function() {
	$(this).fadeOut();
	$('.messages').animate({scrollTop: $('.messages')[0].scrollHeight}, 'fast');
});