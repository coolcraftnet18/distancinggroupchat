document.getElementById("send-message").addEventListener("click", sendMessage);
document.getElementById("message").addEventListener("keypress", typeMessage);

var typingStatus = document.getElementById("typing-status"),
    receivingMessage = document.getElementById("receiving-messages"),
    uuid = "",
    person = prompt("Please enter your name:", "");

document.addEventListener('DOMContentLoaded', function () {
    if (Notification.permission !== "granted")
      Notification.requestPermission();
});

if (person == null || person == "") {
	uuid = "random-generated-"+Math.floor(Math.random() * 100000);
} else {
	uuid = person;
}

PubNub = new PubNub ({
  publishKey : 'pub-c-e6e2c68d-3b41-41f7-ad3c-840d2090830e',
  subscribeKey : 'sub-c-69f8510c-3185-11e7-9967-02ee2ddab7fe',
  uuid: uuid
});

PubNub.addListener({
  status: function(statusEvent) {
    console.log(statusEvent);
  },
  message: function(receivingMsg) {
    timestamp = receivingMsg.timetoken.slice(0, -4);

    var date = new Date(1493982933779),
        hours = date.getHours(),
        minutes = "0" + date.getMinutes(),
        seconds = "0" + date.getSeconds();

    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);		

    receivingMessage.innerHTML += '<div><span>'+receivingMsg.publisher+': </span><span class="message">'+receivingMsg.message.text+'</span><span class="timestamp">'+formattedTime+'</span></div>';

    messageNotification(receivingMsg.publisher, receivingMsg.message.text);
  },
  presence: function(presenceEvent) {
    if(PubNub.getUUID() != presenceEvent.uuid && presenceEvent.state.isTyping)
      typingStatus.innerHTML = presenceEvent.uuid+" is Typing";
    else 
      typingStatus.innerHTML = "";
  }
});
 
PubNub.subscribe({ 
  channels: ['group-chat'],
  withPresence: true
});

function sendMessage() {
  var messageValue = document.getElementById("message");
  if(!messageValue.value)
    return;
	
  PubNub.publish(
    {
      message: {
        text: messageValue.value
      },
      channel: 'group-chat',    
      storeInHistory: true,
      ttl: 24
		},
		function (status, response) {
			if (status.error) {
				console.log(status)
			} else {
				console.log("message Published w/ timetoken", response.timetoken)
			}
		}
	);

	PubNub.setState(
		{
			state: {
				"isTyping": false
			},
			channels: ['group-chat'],
		},
		function (status, response) {
			if (status.error) {
				console.log(status);
			} else {
				typingStatus.innerHTML = "";
			}
		}
	);

	messageValue.value = "";
}

function typeMessage() {
	PubNub.setState(
		{
			state: {
				"isTyping": true
			},
			channels: ['group-chat'],
		},
		function (status, response) {
			if (status.error) {
				console.log(status)
			}
		}
	);
}

function messageNotification(sender, receivedMessage) {
  if (!Notification) {
      alert('Desktop notifications not available in your browser.'); 
      return;
  }
  if (Notification.permission !== "granted"){
      Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        var notification = new Notification(sender+' says', {
          icon: 'https://www.pubnub.com/static/images/structure/favicon.png',
          body: receivedMessage,
        });
        
        notification.onshow = function() {  
          setTimeout(function () {
            notification.close()
          }, 10000);
        }
      }
    });
  } else {
    var notification = new Notification(sender+' says', {
      icon: 'https://www.pubnub.com/static/images/structure/favicon.png',
      body: receivedMessage,
    });
    
    notification.onshow = function() { 
      setTimeout(function () {
        notification.close()
      }, 10000);
    }
    
    notification.onclick = function () {
      window.focus(window.location.href); 
      notification.close();
    };
  }
}
