/*
const express = require('express');
const app = express();


const bcryptjs = require('bcryptjs');
const Usuario = require('../models/usuario');




app.post('/google', function(req, res) {

    let token = req.body.idtoken;

    verify(token);
});








const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    //const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
    console.log(payload.name);
    console.log(payload.email);

}
//verify().catch(console.error);


*/




module.exports = app;