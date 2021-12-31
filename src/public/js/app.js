const socket = io();

const welcome = document.getElementById("welcome");

const form = welcome.querySelector("form");

const room = document.getElementById("room");
room.hidden = true;

const myName = room.querySelector(".myname");

let roomName;

const addMessage = (message) => {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
};

const handleMessageSubmit = (e) => {
    e.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
};

const handleNameSubmit = (e) => {
    e.preventDefault();
    const input = room.querySelector("#name input");
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    myName.innerText = input.value;
    li.innerText = `Your nickname is changed to ${input.value}`;
    ul.appendChild(li);
    socket.emit("nickname", input.value);
    input.value = "";
};

const showRoom = (name) => {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    console.log('마이네임');
    console.log(myName);
    console.log(myName.innerText);
    myName.innerText = name;
    const nameForm = room.querySelector("#name");
    const msgForm = room.querySelector("#msg");
    nameForm.addEventListener("submit", handleNameSubmit);
    msgForm.addEventListener("submit", handleMessageSubmit);
};

const handleRoomSubmit = (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    const initialName = prompt("이름을 지어주세요.");
    socket.emit("enter_room", input.value, initialName, showRoom);
    roomName = input.value;
    input.value = "";
};

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} Arrived!`);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left ㅠㅠ`);
});

socket.on("new_message", addMessage);

socket.on("new_nickname", addMessage);

socket.on("room_change", rooms => {
    const roomList = welcome.querySelector("ul");
    if (rooms.length === 0) {
        roomList.innerHTML = "";
        return;
    }
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerHTML = room; // "<a href='/" + room + "'>" + room + "</a>";
        roomList.appendChild(li);
    });
});