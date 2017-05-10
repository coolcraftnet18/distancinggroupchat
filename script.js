document.getElementById("send-message").addEventListener("click", sendMessage);
document.getElementById("message").addEventListener("keypress", typeMessage);

var typingStatus = document.getElementById("typing-status"),
    receivingMessage = document.getElementById("receiving-messages"),
    uuid = "",
    person = prompt("Please enter your name:", ""),
    
    monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    historyDate = "",
    historyMonth = "";

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
  publishKey : 'pub-c-8a0d91c5-986f-425c-a9b6-f9cceaaa79f8',
  subscribeKey : 'sub-c-7a30f168-357d-11e7-887b-02ee2ddab7fe',
  uuid: uuid
});

PubNub.history(
  {
    channel: "groupChat"
  },
  function (status, response) {
    receivingMessage.innerHTML = response.messages.map(function (m) {
      var date = new Date(m.entry.timestamp),
          originDate = date.getDate(),
          originMonth = monthNames[date.getMonth()],
          originYear = date.getFullYear(),
          hours = date.getHours(),
          minutes = "0" + date.getMinutes(),
          seconds = "0" + date.getSeconds();

      var dateSpan = "";
      if(historyDate != originDate && historyMonth != originMonth) {
        historyDate = originDate;
        historyMonth = originMonth;
        dateSpan = '<div class="datetime">' + originMonth + ' ' + originDate + ', ' + originYear + '</div>';
      }
      var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);		

      var historyMessage = dateSpan + '<div><span>' + m.entry.uuid + '</span><span class="message">' + m.entry.text + '</span><span class="timestamp">' + formattedTime + '</span></div>';
      return historyMessage; 
    }).join('');
  }
);

PubNub.addListener({
  status: function(statusEvent) {
    console.log(statusEvent);
  },
  message: function(receivingMsg) {
    var date = new Date(receivingMsg.message.timestamp),
          originDate = date.getDate(),
          originMonth = monthNames[date.getMonth()],
          originYear = date.getFullYear(),
          hours = date.getHours(),
          minutes = "0" + date.getMinutes(),
          seconds = "0" + date.getSeconds();

      var dateSpan = "";
      if(historyDate != originDate && historyMonth != originMonth) {
        historyDate = originDate;
        historyMonth = originMonth;
        dateSpan = '<div class="datetime">' + originMonth + ' ' + originDate + ', ' + originYear + '</div>';
      }

    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);		

    receivingMessage.innerHTML += dateSpan + '<div><span>'+receivingMsg.publisher+': </span><span class="message">'+receivingMsg.message.text+'</span><span class="timestamp">'+formattedTime+'</span></div>';

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
  channels: ['groupChat'],
  withPresence: true
});

function sendMessage() {
  var messageValue = document.getElementById("message");
  if(!messageValue.value)
    return;
	
  PubNub.publish({
    message: {
      text: messageValue.value,
      uuid: uuid,
      timestamp: new Date().getTime()
    },
    channel: 'groupChat',    
    storeInHistory: true,
    ttl: 24
  });

  PubNub.setState(
    {
      state: {
        "isTyping": false
      },
      channels: ['groupChat'],
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
			channels: ['groupChat'],
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
  if (Notification.permission !== "granted") {
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
