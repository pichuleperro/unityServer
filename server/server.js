const server = require('http').createServer(3000, (req, res) => {

    res.write('servidor corriendo en el puerto 3000');
    res.end();

});
const io = require('socket.io')(server);

io.on('connection', client => {

    console.log(`el usuario con el id ${client.id} se ha conectado`);


    client.on('Test', (data) => {

        console.log(data);

    });





    client.on('disconnect', () => {

        console.log(`el usuario con el id ${client.id} se ha desconectado`);

    });
});


server.listen(3000, (err) => {

    if(err) { throw new Error(err); }

    console.log('servidor corriendo en el puerto 3000');



});