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


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lnkho.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect()
        const test = client.db("testDB").collection("testcollection");
        const reviews = client.db("reviewDB").collection("reviewcollection");
        const userprifile = client.db("prifileDB").collection("prifileCollection");
        
        app.post('/review-post', async (req, res) => {
            const newPD = req.body
            const result = await reviews.insertOne(newPD);
            res.send({ success: 'Added Product Successfully' })
            
        }) 

        //get
        app.get('/review-get', async (req, res) => {
            const query = {}
            const cursor = reviews.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        
        app.post('/profile-post', async (req, res) => {
            const submitprofile = req.body;
            const query = {
                date: submitprofile.date, 
                phone: submitprofile.phone, 
                study: submitprofile.study, 
                country: submitprofile.country, 
                state: submitprofile.state, 
                zip: submitprofile.zip, 
                link: submitprofile.link
                }
            const exists = await userprifile.findOne(query);
            if (exists) {
                return res.send({ success: false, submitprofile: exists })
            }
            const result = await userprifile.insertOne(submitprofile);
            return res.send({ success: true, result });
        })

    }
    finally {
        //await client.close()
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Show Here ${port}`)
})


