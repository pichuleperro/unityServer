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

//===================
// CONFIGURACION EXPRESS
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
//===================
// CONEXION A MONGOOSE  
//===================
//////////////////////////////////////////////


mongoose.connect('mongodb://localhost:27017/tandemTela', { useNewUrlParser: true }, (err, res) => {
    if (err) throw err;
    let enLinea = 'EN LINEA'.green;
    console.log();
    console.log(`Base de datos ${enLinea}`);
});
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
//===================
// CONEXION , ENVIO DE DATOS AL CLIENTE Y GUARDADO DE DATOS 
//===================
//////////////////////////////////////////////
//////////////////////////////////////////////
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
let shortid = require('shortid');



io.on('connection', (client) => {

    client.setMaxListeners(6000000);

    console.log();
    console.log('Estableciendo conexion con el usuario'.green);
    console.log();

    client.on('registro', (data) => {

        let player = new Usuario({
            UserName: data.UserName,
            password: bcryptjs.hashSync(data.PassWord, 10)
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
        });

    });



    function UnirseASala(clientId, gameMode) {

        let playersRoomsBR = 3;
        let playersRoomsSG = 2;

        let player = {
                id: clientId
            }
            // una vez que sepamos que exista una sala debemos ingresar al player a dicha sala ya creada

        if (gameMode == 'BattleRoyale') {
            for (let index = 0; index < rooms.length; index++) {
                const element = rooms[index];
                if (element.gameMode == 'BattleRoyale') {
                    if (element.players.length < playersRoomsBR) { element.disponible = true; } else { element.disponible = false; }
                }

                if (element.disponible && element.gameMode == 'BattleRoyale') { element.players.push(player); break; }


                console.log(element.players);
            }
        }
        if (gameMode == 'StealGold') {
            for (let index = 0; index < rooms.length; index++) {
                const element = rooms[index];
                if (element.gameMode == 'StealGold') {
                    if (element.players.length < playersRoomsSG) { element.disponible = true; } else { element.disponible = false; }
                }

                if (element.disponible && element.gameMode == 'StealGold') { element.players.push(player); break; }


                console.log(element.players);
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
            disponible: true
        }

        rooms.push(room);

    }


    client.on('BuscarSala', (data) => {

        // recordar si el usuario cancela la busqueda
        if (data.GameMode == 'BattleRoyale') {
            if (SalasBattleRoyaleDisponibles() != 0) { UnirseASala(client.id, data.GameMode); }

            if (SalasBattleRoyaleDisponibles() == 0) {
                CrearSala(data.GameMode);
                UnirseASala(client.id, data.GameMode);
            }
        }
        if (data.GameMode == 'StealGold') {
            if (SalasStealGoldDisponibles() != 0) { UnirseASala(client.id, data.GameMode); }

            if (SalasStealGoldDisponibles() == 0) {
                CrearSala(data.GameMode);
                UnirseASala(client.id, data.GameMode);
            }
        }


        console.log('Cantidad de salas : '.yellow + `${rooms.length}`.green);
        console.log();

        console.log(rooms);
        console.log();

    });












    client.on('disconnect', () => {
        console.log();
        console.log('Desconexion del usuario'.red);
        console.log();

    });

});