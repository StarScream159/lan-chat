// app binds

// contact list
$('#contacts').on('click', '.contact:not(.active)', function() {
	$('.contact-profile').fadeIn('fast');
	$('#contacts').find('.contact').removeClass('active');
	$(this).addClass('active');
	
	var clc = ContactList.findById($(this).data('uuid'));
	clc.loadMessages();
	clc = null // trashman
});

// messaging
$('.submit').click(function() {
	newMessageSend();
});

$(window).on('keydown', function(e) {
  if (e.which == 13) {
    newMessageSend();
    return false;
  }
});