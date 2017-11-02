const express = require('express'),
    bodyParser = require('body-parser'),
    mongodb = require('mongodb');
objectId = require('mongodb').ObjectId;

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
        mongoclient.collection('postagens', (err, collection) => {
            collection.insert(dados, (err, records) => {
                if (err) {
                    res.json({ 'status': 'erro' });
                } else {
                    res.json({ 'status': 'inclusão realizada com sucesso' });
                }
                mongoclient.close();
            });
        });
    });
});

//GET (ready)
app.get('/api', (req, res) => {
    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.find().toArray((err, results) => {
                if (err) {
                    res.json(err);
                } else {
                    res.json(results);
                }
                mongoclient.close();
            });
        });
    });
});

//GET by ID (ready)
app.get('/api/:id', (req, res) => {
    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.find(objectId(req.params.id)).toArray((err, results) => {//find({ _id: req.params.id}) é a mesma coisa
                if (err) {
                    res.status(500).json(err);//Internal Server Error
                } else {
                    res.status(200).json(results);
                }
                mongoclient.close();
            });
        });
    });
});

//PUT by ID (update)
app.put('/api/:id', (req, res) => {
    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.update(
                { _id: objectId(req.params.id) },
                { $set: { titulo: req.body.titulo } },
                {},
                (err, records) => {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(records);
                    }
                    mongoclient.close();
                }
            );
        });
    });
});

//DELETE by ID (remover)
app.delete('/api/:id', (req, res) => {
    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.remove({ _id: objectId(req.params.id) }, (err, records) => {
                if (err) {
                    res.json(err);
                } else {
                    res.json(records);
                }
                mongoclient.close();
            });
        });
    });
});