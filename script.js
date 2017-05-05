document.getElementById("send-message").addEventListener("click", sendMessage);
document.getElementById("message").addEventListener("keypress", typeMessage);

var typingStatus = document.getElementById("typing-status"),
    receivingMessage = document.getElementById("receiving-messages"),
    uuid = "",
    person = prompt("Please enter your name:", "");

if (person == null || person == "") {
	uuid = "random-generated-"+Math.floor(Math.random() * 100000);
} else {
	uuid = person;
}

PubNub = new PubNub ({
	publishKey : 'pub-c-000133bb-9b43-47e4-bf65-bd19559a8542', // Your Pub Key
	subscribeKey : 'sub-c-55f4ee4c-2f26-11e7-9a1a-0619f8945a4f', // Your Sub Key
	uuid: uuid
});

PubNub.addListener({
    status: function(statusEvent) {
        console.log(statusEvent);
    },
    message: function(receivingMsg) {
        console.log("Message: ", receivingMsg);
		receivingMessage.innerHTML += '<div><span>'+receivingMsg.publisher+': </span><span class="message">'+receivingMsg.message.text+'</span><span class="timestamp">'+receivingMsg.timetoken+'</span></div>';
		;
    },
    presence: function(presenceEvent) {
		if(PubNub.getUUID() != presenceEvent.uuid && presenceEvent.state.isTyping)
			typingStatus.innerHTML = presenceEvent.uuid+" is Typing";
		else 
			typingStatus.innerHTML = "";
    }
})
 
PubNub.subscribe({ 
    channels: ['test-typing'], // change channel name by your channel name
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
			channel: 'test-typing', // change channel name by your channel name
			sendByPost: false,
			storeInHistory: false,
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
			channels: ['test-typing'],
		},
		function (status, response) {
			if (status.error) {
				console.log(status)
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
			channels: ['test-typing'],
		},
		function (status, response) {
			if (status.error) {
				console.log(status)
			}
		}
	);
}
