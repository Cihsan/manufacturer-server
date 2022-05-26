const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors') //support diffrent port
require('dotenv').config()// for envirment variable
const port = process.env.PORT || 5000
const app = express()
const jwt = require('jsonwebtoken');
app.use(cors()) //
app.use(express.json()) //for parse

app.get('/', (req, res) => {
    res.send('Welcome To Manufacture Server')
})

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.VALID_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lnkho.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect()
        const test = client.db("testDB").collection("testcollection");
        const reviews = client.db("reviewDB").collection("reviewcollection");
        const userprifile = client.db("prifileDB").collection("prifileCollection");
        const userlogin = client.db("userLoginDB").collection("userLoginCollection");
        const product = client.db("productDB").collection("productCollection");

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userprifile.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        }
        //user entry
    
        app.post('/review-post', verifyJWT, async (req, res) => {
            const review = req.body
            const result = await reviews.insertOne(review);
            res.send({ success: 'Added review Successfully' })
        })
        
        //get
        app.get('/review-get', async (req, res) => {
            const query = {}
            const cursor = reviews.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        
        //
        app.get('/profile-get', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
              const query = { email: email };
              const bookings = await userprifile.find(query).toArray();
              return res.send(bookings);
            }
            else {
              return res.status(403).send({ message: 'forbidden access' });
            }
          });

        app.post('/profile-post', verifyJWT, async (req, res) => {
            const submit = req.body;
            const query = {
                name: submit.name,
                email: submit.email,
                date: submit.date,
                phone: submit.phone,
                study: submit.study,
                country: submit.country,
                state: submit.state,
                zip: submit.zip,
                link: submit.link
            }
            const exists = await userprifile.findOne(query);
            if (exists) {
                return res.send({ success: false, submit: exists })
            }
            const result = await userprifile.insertOne(submit);
            return res.send({ success: true, result });
        })

        //product
        app.post('/product-post', async (req, res) => {
            const productPost = req.body
            const result = await product.insertOne(productPost);
            res.send({ success: 'Added Product Successfully' })
        })
        app.get('/product-get', async (req, res) => {
            const query = {}
            const cursor = product.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.delete('/product-del/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await product.deleteOne(query)
            res.send(result)
        })
        //user
        app.get('/user', async (req, res) => {
            const users = await userlogin.find().toArray();
            res.send(users);
          });
      
          app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userlogin.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
          })
      
          //make admin
          app.put('/user/admin/:email',verifyJWT, async  (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
              $set: { role: 'admin' },
            };
            const result = await userlogin.updateOne(filter, updateDoc);
            res.send(result);
          })
          
          //login time
          app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userlogin.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.VALID_TOKEN, { expiresIn: '1h' })
            res.send({ result, token });
          });
    }
    finally {
        //await client.close()
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Show Here ${port}`)
})


