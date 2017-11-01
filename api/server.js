const express = require('express'),
    bodyParser = require('body-parser'),
    mongodb = require('mongodb');

const app = express();

//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = 8080;

app.listen(port)

const db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
)

console.log('Servidor HTTP esta escutando na porta ' + port);

app.get('/', (req, res) => {
    res.send({ msg: 'Olá' });
});

//URI + verbo HTTP
//POST (create)
app.post('/api', (req, res) => {
    let dados = req.body;
    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) =>{
            collection.insert(dados, (err, records) =>{
                if(err){
                    res.json({'status': 'erro'});
                }else{
                    res.json({'status': 'inclusão realizada com sucesso'});
                }
                mongoclient.close();
            });
        });
    });
});