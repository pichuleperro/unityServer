/*
const { io } = require('../server');


//====================
//  CONEXION
//====================

io.on('connection', (client) => {

    client.on('msg', (data) => {
        console.log(data);
        console.log();
    });




    client.emit('pruebaConexion', { mensaje: 'Jugador conectado' });


    //////////////////
    ////   DESCONEXION
    //////////////////

    client.on('disconnect', () => {
        console.log();
        console.log('Jugador desconectado');
        console.log();
    });


});




*/