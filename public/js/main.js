// Start Dynamic Chat App Script

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}



const userData= JSON.parse(getCookie('user'));
console.log('Cookie Data:', userData);

const sender_id = userData._id;
let receiver_id;
const socket= io('/user-namespace', {
  auth:{
      token: userData._id 
      }
});


  $(document).ready(function(){
$('.user-list').click(function(){

 const userId = $(this).attr('data-id');
 receiver_id = userId;

  $('.start-head').hide();
  $('.chat-section').show();

   socket.emit('existsChat', { sender_id: sender_id, receiver_id:receiver_id });

});

  });

//grt user online-status
socket.on('getOnlineUser', (data)=>{
  $('#' +data.user_id+'-status').text('Online');
  $('#' +data.user_id+'-status').removeClass('offline-status');
  $('#' +data.user_id+'-status').addClass('online-status');
});

//get offline-status
socket.on('getOfflineUser', (data)=>{
  $('#' +data.user_id+'-status').text('Offline');
  $('#' +data.user_id+'-status').addClass('offline-status');
  $('#' +data.user_id+'-status').removeClass('online-status');
});

//chat save of user

$('#chat-form').submit(function(event){
  event.preventDefault();
 const message =  $('#message').val();

 $.ajax({
url:'/save-chat',
type:'Post',
data:{sender_id:sender_id, receiver_id:receiver_id, message:message},
success: function(response) {
  if(response.success)  {
      console.log(response.data.message);
      $('#message').val('');
      let chat = response.data.message;
      let html = `
      <div class="current-user-chat" id= '`+response.data._id+`' >
     <h5><span> `+chat+` </span>
      <i class="fa fa-trash" aria-hidden="true" data-id='` +response.data._id+ `' data-toggle="modal" data-target="#deleteChatModal"></i>
      <i class="fa fa-edit" aria-hidden="true" data-id='` +response.data._id+ `' data-msg='`+chat+`' data-toggle="modal" data-target="#editChatModal"></i>


        </h5>
      </div>
      `;
  // Append the chat message to the chat container
  $('#chat-container').append(html);
  socket.emit('newChat', response.data);
  scrollChat();

  }
else{
  alert(data.msg);
}
}
 });
});

socket.on('loadNewChat', (data)=>{
 if(sender_id == data.receiver_id && receiver_id == data.sender_id){
 
 let html = `
 <div class="distance-user-chat" id='`+data._id+`' >
     <h5><span>`+data.message+`</span></h5>
      </div>
      `;
  // Append the chat message to the chat container
  $('#chat-container').append(html);
  }
 scrollChat();
});
       
  //Load old chats
  socket.on('loadChats',  (data) => {
  $('#chat-container').html('');
  const chats = data.chats;
  let html = '';
  for(let x = 0; x < chats.length; x++){
      let addClass = '';
      if(chats[x]['sender_id'] == sender_id){
          addClass = 'current-user-chat';
      } else {
          addClass = 'distance-user-chat';
      }
      html +=`
      <div class='` + addClass + `' id='` + chats[x]['_id'] + `'>
          <h5><span>` + chats[x]['message'] + `</span>`;

      if(chats[x]['sender_id'] == sender_id){
          html +=`  <i class="fa fa-trash" aria-hidden="true" data-id='` + chats[x]['_id'] + `' data-toggle="modal" data-target="#deleteChatModal"></i> 
                    <i class="fa fa-edit" aria-hidden="true" data-id='` + chats[x]['_id'] +`' data-msg='`+ chats[x]['message'] +`' data-toggle="modal" data-target="#editChatModal"></i>
          `;
      }
      html +=`
          </h5>
      </div>`;
  }
  $('#chat-container').append(html);
  scrollChat();
});


function scrollChat(){
    $('#chat-container').animate({
      scrollTop:$('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
    }, 0);
};

// Deleting chat
$(document).on('click', '.fa-trash', (event)=> {
let msg= $(event.target).parent().text();
$('#delete-message').text(msg);
$('#delete-message-id').val($(event.target).attr('data-id'));

});

$('#delete-chat-form').submit(function(event){
  event.preventDefault();
  const id = $('#delete-message-id').val();
  $.ajax({
      url:'/delete-chat',
      type:'Post',
      data:{id:id},
      success:function(res){
          if (res.success == true) {
              $('#' + id).remove();
              $('#deleteChatModal').modal('hide');
              socket.emit('chatDeleted', id);
          } else {
              alert(res.msg);
          }
      }
  });
});

socket.on('chatMessageDeleted', (id)=>{
  $('#' + id).remove();
});

//update user chat

$(document).on('click', '.fa-edit', function(){
$('#edit-message-id').val($(this).attr('data-id'));
$('#update-message').val($(this).attr('data-msg'));
}) ;

$('#update-chat-form').submit(function(event){
  event.preventDefault();
  const id = $('#edit-message-id').val();
  const msg = $('#update-message').val();

  $.ajax({
      url:'/update-chat',
      type:'Post',
      data:{id:id , message:msg},
      success:function(res){
          if (res.success == true) {
          
              $('#editChatModal').modal('hide');
              $('#' +id.find('span').text(msg));
              $('#' +id.find('.fa-edit').attr('data-msg', msg));
              socket.emit('chatUpdated', {id:id , message:msg});
          } else {
              alert(res.msg);
          }
      }
  });
});

socket.on('chatMessageUpdated', function(data){
  $('#' +data.id).find('span').text(data.message);
});

//AddMember js

$('.addMember').click(function(){
    const id = $(this).attr('data-id');
    const limit = $(this).attr('data-limit');

    $('#group_id').val(id);
    $('#limit').val(limit);


    $.ajax({
        url:'http://localhost:8000/get-members',
        type:'POST',
        data: JSON.stringify(group_id = id),
        contentType: "application/json",
        success:function(res){
          console.log(res);
            if(res.success == true){
               let users = res.data;

               let html = '';     
                
                 for(let i = 0; i < users.length; i++){

                    let isMemberOfGroup = users[i]['members'].length > 0? true: false;

                     html +=`
                       <tr>
                          <td>
                              <input type="checkbox" `+(isMemberOfGroup? 'checked': '')+` name="members[]" value="`+users[i]['_id']+`"/>
                          </td>
                          <td>`+users[i]['name']+` </td>
                       </tr>
                     `;
                 }
                 $('.addMemberTable').html(html);
            }
            else{
                alert(res.msg);
            }
        }
    });

}) ;


//add members form submit code

$('#add-member-form').submit(function(event){
    event.preventDefault();

    const formData = $(this).serialize();

    $.ajax({
         url :"/add-members",
         type:"POST",
         data: formData,
         success:function(res){
            if(res.success ){
               $('#memberModal').modal('hide');
               $('#add-member-form')[0].reset();
               alert(res.msg);
            }
            else{
                $('#add-member-error').text(res.msg);
                setTimeout(() => {
                    $('#add-member-error').text('');
                },3000);
               }

         }

    });
})












