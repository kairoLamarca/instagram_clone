const express = require('express'),
    bodyParser = require('body-parser'),
    multiParty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectId = require('mongodb').ObjectId,
    fs = require('fs'),
    fsx = require('fs-extra');

const app = express();

//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiParty());//para a aplicação aceitar forms multipart/formdata

app.use((req, res, next) => {

    res.setHeader("Access-Control-Allow-Origin", "*");//permite acesso para qualquer aplicação(dominio)
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");//Configurar metodos que a origem pode requisitar
    res.setHeader("Access-Control-Allow-Headers", "content-type");//Habilitar que a req da origem tenha cabeçalhos reescritos
    res.setHeader("Access-Control-Allow-Credentials", true);//

    next();
})

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

    //res.setHeader("Access-Control-Allow-Origin", "http://localhost:80"); //permite acesso somente para essa aplicação
    //res.setHeader("Access-Control-Allow-Origin", "*"); //permite acesso para qualquer aplicação

    let date = new Date();
    let time_stamp = date.getTime();

    let url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;
    let path_origem = req.files.arquivo.path;
    let path_destino = './uploads/' + url_imagem;

    fsx.move(path_origem, path_destino, function (err) {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        }

        db.open(function (err, mongoclient) {
            mongoclient.collection('postagens', function (err, collection) {
                collection.insert(dados, function (err, records) {
                    if (err) {
                        res.json({ 'status': 'erro' });
                    } else {
                        res.json({ 'status': 'inclusao realizada com sucesso' });
                    }
                    mongoclient.close();
                });
            });
        });

    });
});

//GET (ready)
app.get('/api', (req, res) => {

    //res.setHeader("Access-Control-Allow-Origin", "*");

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

app.get('/imagens/:imagem', (req, res) => {

    let img = req.params.imagem;

    fs.readFile('./uploads/' + img, (err, content) => {
        if (err) {
            res.status(400).json(err);
            return;
        }

        //mesma coisa que o setHeader
        res.writeHead(200, { 'content-type': 'image/jpg' })

        res.end(content);
    });
})

//PUT by ID (update)
app.put('/api/:id', (req, res) => {

    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.update(
                { _id: objectId(req.params.id) },
                {
                    $push:
                    {
                        comentarios: {
                            id_comentario: new objectId(),
                            comentario: req.body.comentario
                        }
                    }
                },//inclui um item em um array
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
            collection.update(
                {},
                {
                    $pull: {
                        comentarios: { id_comentario: objectId(req.params.id) }
                    }
                },
                { multi: true },
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