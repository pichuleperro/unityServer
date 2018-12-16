//#region requires
require('colors');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcryptjs = require('bcryptjs');
//const { OAuth2Client } = require('google-auth-library');  ||    Módulos para google sign - in
//const client = new OAuth2Client(process.env.CLIENT_ID);   ||
//#endregion

//===================
//#region CONFIGURACION EXPRESS
//===================
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
//app.use(require('./routes/usuario'));
//===================
// HBS
//===================
const hbs = require('hbs');
hbs.registerPartials(__dirname + 'views');
app.set('view engine', 'hbs');
app.get('/', (req, res) => {
    res.render('home');
});
let server = http.createServer(app);
const publicPath = path.resolve(__dirname, '../public');
const port = process.env.PORT || 3000;
app.use(express.static(publicPath));

server.listen(port, (err) => {
    if (err) throw new Error(err);
    console.log(`Servidor corriendo en puerto ${ port }`);
    console.log();
});
//#endregion
//===================
//#region CONEXION A MONGOOSE Y ESQUEMA MODELS 
//===================
//////////////////////////////////////////////


mongoose.connect('mongodb://localhost:27017/tandemTela', { useNewUrlParser: true }, (err, res) => {
    if (err) throw err;
    let enLinea = 'EN LINEA'.green;
    console.log();
    console.log(`Base de datos ${enLinea}`);
});
mongoose.set('useCreateIndex', true);
//===================
// USUARIO ESQUEMA MODELS 
//===================
let Schema = mongoose.Schema;
let usuarioSchema = new Schema({
    nombre: {
        type: String,
    },
    UserName: {
        type: String,
        unique: true,
        required: [true, 'El nombre de usuario  es necesario']
    },
    //  email: {
    // type: String,
    // unique: true,
    // required: [true, 'El correo es necesario']
    //  },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },

    estado: {
        type: Boolean,
        default: true
    }

    // google: {
    //  type: Boolean,
    //default: false
    // }
});
usuarioSchema.methods.toJSON = function() {
    let user = this;
    let userObject = user.toObject;
    delete userObject.password;
    return userObject;
}
usuarioSchema.plugin(uniqueValidator, { message: '{PATH} debe de ser unico' });
let Usuario = mongoose.model('Usuario', usuarioSchema);
//#endregion

//===================
//#region CONEXION , ENVIO DE DATOS AL CLIENTE Y GUARDADO DE DATOS 
//===================
//////////////////////////////////////////////

let io = socketIO(server);

/*
let usuarioGoogle;

app.post('/google', async(req, res) => {
    let usuarioGoogle;
    let token = req.body.idtoken;
    usuarioGoogle = await verify(token);


    let usuarioEmail = `${usuarioGoogle.email}`.green;
    console.log(`Usuario: ${usuarioEmail} a iniciado sesión `);

});
*/
let rooms = [];
let playersConnected = [];
let shortid = require('shortid');



io.on('connection', (client) => {

    client.setMaxListeners(6000000);

    console.log();
    console.log('Estableciendo conexion con el usuario'.green);
    console.log();



    client.on('registro', (data) => {

        let player = new Usuario({
            UserName: data.UserName,
            password: bcryptjs.hashSync(data.PassWord, 10),

        });
        player.save((err, usuarioDB) => {
            if (err) {
                client.emit('info', { mensaje: `${err.message}` });
                console.log(err.message);
            } else {
                console.log(usuarioDB);
                client.emit('info', { mensaje: 'registro completado exitosamente' });
                let usuarioDBNombre = `${usuarioDB.UserName}`.green;
                console.log(`Cliente: ${usuarioDBNombre} ha sido registrado exitosamente `);
            }
        });
    });

    client.on('Login', (data) => {

        Usuario.findOne({ UserName: data.UserName }, (err, usuarioDB) => {

            if (err) {
                console.log(err);
            }
            if (!usuarioDB) {
                return client.emit('Login', { mensaje: 'El nombre de usuario no existe en la base de datos.', ok: 'false' })
            }

            if (!bcryptjs.compareSync(data.PassWord, usuarioDB.password)) {
                return client.emit('Login', { mensaje: 'La contraseña no es correcta. ', ok: 'false' });
            }

            client.emit('Login', { mensaje: 'se ha iniciado sesion correctamente', ok: 'true', id: usuarioDB.id });

            let usuarioDBNombre = `${usuarioDB.UserName}`.green;
            console.log(`Cliente: ${usuarioDBNombre} se ha autenticado exitosamente `);

            let player = {
                id: usuarioDB._id,
                nombre: usuarioDB.UserName,
                idSession: client.id
            }
            playersConnected.push(player);
            // emitir al cliente la id
            client.emit('UserData', { player: player });

        });

    });

    client.on('BuscarSala', (data) => {


        if (data.GameMode == 'BattleRoyale') {
            if (SalasBattleRoyaleDisponibles() != 0) { UnirseASala(client.id, data.GameMode); return ComenzarPartida(); }

            if (SalasBattleRoyaleDisponibles() == 0) {
                CrearSala(data.GameMode);
                UnirseASala(client.id, data.GameMode);
                return ComenzarPartida();
            }
        }
        if (data.GameMode == 'StealGold') {
            if (SalasStealGoldDisponibles() != 0) { UnirseASala(client.id, data.GameMode); return ComenzarPartida(); }

            if (SalasStealGoldDisponibles() == 0) {
                CrearSala(data.GameMode);
                UnirseASala(client.id, data.GameMode);
                return ComenzarPartida();
            }
        }



        console.log();
        console.log('Cantidad de salas : '.yellow + `${rooms.length}`.green);
        console.log();




    });

    client.on('Cancelar', (data) => {

        console.log(`El jugador ${data.userName} ha cancelado la busqueda`);

        SalirSala(data.idSession);

    });

    client.on('Partida', (data) => {

        io.to(data.idRoom).emit('Partida', { id: client.id });

    });

    client.on('Input', (data) => {

        io.to(data.idRoom).emit('Input', { input: data.input, id: client.id });
        // client.emit('Input', { x: data.x });

    });

    client.on('UpdatePos', (data) => {

        console.log(data);
        client.broadcast.to(data.idRoom).emit('UpdatePos', { x: data.x, y: data.y, id: client.id });
        // io.to(data.idRoom).emit('UpdatePos', { x: data.x, y: data.y, id: client.id });

    });




    function SalirSala(_id) {

        for (let index = 0; index < rooms.length; index++) {
            const element = rooms[index];

            for (let i = 0; i < element.players.length; i++) {
                const e = element.players[i];
                if (e.id == _id) {

                    function Jugador(player) {
                        return player.id === _id;
                    }

                    let pos = element.players.findIndex(Jugador); // buscamos al jugador en la room

                    element.players.splice(pos, 1); // eliminamos al jugador de la room

                    client.leave(element.idRoom); // desconectamos al jugador de la room

                    break;

                }
            }
        }
    } //// aca retiramos al usuario de la sala 

    function UnirseASala(clientId, gameMode) {

        let playersRoomsBR = 3;
        let playersRoomsSG = 2;

        let player = {
                id: client.id
            }
            ///////

        if (gameMode == 'BattleRoyale') {
            for (let index = 0; index < rooms.length; index++) {
                const element = rooms[index];
                if (element.gameMode == 'BattleRoyale') {
                    if (element.players.length < playersRoomsBR) { element.disponible = true; } else { element.disponible = false; }
                }

                if (element.disponible && element.gameMode == 'BattleRoyale') {
                    element.players.push(player);
                    client.join(element.idRoom); // ingresamos al usuario a la sala

                    if (element.players.length < playersRoomsBR) { element.disponible = true; } else { element.disponible = false; }

                    break;
                }
            }
        }
        if (gameMode == 'StealGold') {
            for (let index = 0; index < rooms.length; index++) {
                const element = rooms[index];
                if (element.gameMode == 'StealGold') {
                    if (element.players.length < playersRoomsSG) { element.disponible = true; } else { element.disponible = false; }
                }

                if (element.disponible && element.gameMode == 'StealGold') {
                    element.players.push(player);
                    client.join(element.idRoom); // ingresamos al usuario a la sala

                    break;
                }
            }
        }
    }

    function SalasBattleRoyaleDisponibles() {

        let i = Number();

        rooms.forEach(element => {
            if (element.disponible && element.gameMode == 'BattleRoyale') { i++; }
        });

        return i;
    }

    function SalasStealGoldDisponibles() {

        let i = Number();

        rooms.forEach(element => {
            if (element.disponible && element.gameMode == 'StealGold') { i++; }
        });

        return i;
    }

    function CrearSala(_gameMode) {
        let _idRoom = shortid.generate();

        let room = {
            idRoom: _idRoom,
            gameMode: _gameMode,
            players: [],
            disponible: true,
            enPartida: false
        }
        rooms.push(room);
    }

    function ComenzarPartida() {
        // verificar si la sala esta completa . si lo está , enviar al cliente la sala con todos sus jugadores y comenzar la partida.

        for (let index = 0; index < rooms.length; index++) {
            const element = rooms[index];

            if (element.disponible) { element.enPartida = false }

            if (!element.disponible && !element.enPartida) {

                //  client.broadcast.to(element.idRoom).emit('ComenzarPartida', { idRoom: element.idRoom, players: element.players });
                io.to(element.idRoom).emit('ComenzarPartida', { idRoom: element.idRoom, players: element.players });
                element.enPartida = true;

                let s = `${element.idRoom}`.green;
                console.log(`La sala ${s} ha comenzado la partida `);
                console.log();
                console.log(element.players);
            }
            //

        }
        console.log(rooms);
    }














    client.on('disconnect', () => {


        /*  comprobar si el usuario  se encuentra buscando partida , y si durante este proceso éste se desconecta 
            sacarlo de la lista de rooms , ademas comprobar si el usuario ya en partida se llega a desconectar implementar
            un método para la reconexión 
        */
        let u = `${client.id}`.green;
        console.log();
        console.log(`Desconexion del usuario con el id : ${u}`.red);
        console.log();

    });

});
//#endregion