const { io } = require('../server');



//// CONEXION ////

io.on('connection', (client) => {

    console.log('Jugador conectado');



    // emitimos informacion hacia el cliente
    client.emit('Test', {
        usuario: 'admin',
        mensaje: 'testeando en unity'
    });





    // escuchamos al cliente
    client.on('mensaje', (data) => {

        console.log(data);
        client.emit('cliente', { data });

    });


    client.on('probandoVector', (data) => {
        client.emit('recibiendoVector', data);
        console.log(data);
    });



    //=============================================================================




    client.on('disconnect', () => {
        console.log('Jugador desconectado');
    });





});