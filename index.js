require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express()
const cors = require('cors');


// Middleware
const corsOptions ={
  origin:'*', 
  credentials:true,
  optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwaqdlv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // client.connect();

    const toyCollection = client.db('toyLand').collection('toys')


    const indexKeys = { toyName: 1, category: 1 };
    const indexOption = { name: 'toyCategory' };

    const result = await toyCollection.createIndex(indexKeys, indexOption);


    app.get('/toys', async (req, res) => {

      let query = {};
      if (req.query?.sellerEmail) {
        query = { sellerEmail: req.query.sellerEmail }
      }
      const result = await toyCollection.find(query).sort({ price: 1 }).collation({ locale: "en_US", numericOrdering: true }).toArray();
      res.send(result)
    })

    app.get('/toys/:category', async (req, res) => {
      const toys = await toyCollection.find({ category: req.params.category, }).toArray();
      res.send(toys);
    })


    app.get('/toy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toyCollection.findOne(query);
      res.send(result)
    })


    // Update Toy
    app.put('/toy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updatedToy = req.body;
      const toy = {
        $set: {
          toyName: updatedToy.toyName,
          price: updatedToy.price,
          quantity: updatedToy.quantity,
          description: updatedToy.description
        }
      }
      const result = await toyCollection.updateOne(query, toy, options)

      res.send(result);
    })


    // Add Toy

    app.post('/toys', async (req, res) => {
      const newToy = req.body;
      const result = await toyCollection.insertOne(newToy);
      res.send(result)
    })

    // Delete Toy

    app.delete('/toy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const result = await toyCollection.deleteOne(query)
      res.send(result)
    })

    // Search toy

    app.get('/searchToysByText/:text', async (req, res) => {
      const searchText = req.params.text;

      const result = await toyCollection.find({
        $or: [
          { toyName: { $regex: searchText, $options: 'i' } },
          { category: { $regex: searchText, $options: 'i' } },
        ],
      }).sort({ price: 1 }).collation({ locale: "en_US", numericOrdering: true }).toArray()
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Toy server is Running.....')
})

app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
})