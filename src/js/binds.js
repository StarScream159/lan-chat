// app binds

// contact list
$('#contacts').on('click', '.contact', function() {
	$('#contacts').find('.contact').removeClass('active');
	$(this).addClass('active');
	
	var clc = ContactList.findById($(this).data('uuid'));
	clc.loadMessages();
	clc = null // trashman
});

// messaging
function newMessageSend() {
	var clc = ContactList.findCurrent();
	clc.messageSend($('.message-input input').val());
	$('.message-input input').val('');
	clc = null; // trashman
}
$('.submit').click(function() {
	newMessageSend();
});

$(window).on('keydown', function(e) {
  if (e.which == 13) {
    newMessageSend();
    return false;
  }
});