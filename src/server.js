import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));

app.get('/', (_, res) => res.render('home'));
app.get("/:roomName", (req, res) => {
    if (req.url === "/favicon.ico") {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    } else {
        return res.render("home", { room: req.params.roomName });
    }
});


const handleListen = () => console.log('listen on 3000');

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    }
});

instrument(wsServer, {
    auth: false,
});

const publicRooms = () => {
    const { sockets: { adapter: { sids, rooms } } } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        };
    });
    return publicRooms;
};

const countRoomMembers = (roomName) => {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
};

wsServer.on("connection", socket => {
    socket["nickname"] = "Anonymous";

    socket.onAny(e => console.log(`Socket event: ${e}`));

    socket.on("enter_room", (roomName, name, done) => {
        socket.join(roomName);
        socket["nickname"] = name;
        done(name);

        socket.to(roomName).emit("welcome", socket.nickname, countRoomMembers(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoomMembers(room) - 1));

    });

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });

    wsServer.sockets.emit("room_change", publicRooms());

    socket.on("new_message", (msg, room, done,) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });

    socket.on("nickname", (nickname) => {
        const old_nickname = socket["nickname"];
        socket["nickname"] = nickname;
        socket.rooms.forEach(room => socket.to(room).emit("new_nickname", `${old_nickname} has changed his/her nickname to ${nickname}`));
    });
});

httpServer.listen(3000, handleListen);