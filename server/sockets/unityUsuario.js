/*
const bcryptjs = require('bcryptjs');
const Usuario = require('../models/usuario');
const { io } = require('../server');




io.on('connection', (client) => {

    client.on('ingresar', (data) => {
        console.log('UserName', data.UserName);
        console.log('PassWord', data.PassWord);

        let usuario = new Usuario({
            nombre: data.UserName,
            //email:
            password: bcryptjs.hashSync(data.PassWord, 10)
        });
        usuario.save((err, usuarioDB) => {
            if (err) {
                client.emit('ingresar', { mensaje: ' error al ingresar ' });
                console.log(err);
            }
            //console.log(usuarioDB);
        });


        client.emit('ingresar', data);

    });









});
*/