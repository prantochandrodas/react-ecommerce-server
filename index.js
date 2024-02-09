const express = require('express')
const cors = require("cors");
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;



app.use(cors());

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pbafkul.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJwt(req, res, next) {
  const authHeader = (req.headers.authorization);
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}
async function run() {
  try {
    // get category data
    const productCategoryCollection = client.db('reactecommerce').collection('all_product');
    const userCollection = client.db('reactecommerce').collection('users');
    // //jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
      res.send({ token })
    })
    // add signuped user
    app.post('/addUser', async (req, res) => {
      const post = req.body;
      let cart = {};
      for (let i = 0; i < 300; i++) {
        cart[i] = 0;
      }

      const user = {
        name: post.name,
        email: post.email,
        password: post.password,
        loginStatus: true,
        cartData: cart
      }
      const email = req.body.email;
      const query = { email: email }
      const findUser = await userCollection.findOne(query);
      if (findUser) {
        res.send(false);
      } else {
        const result = await userCollection.insertOne(user);
        res.send(result);
      }

    });


    //add to cart
    app.post('/addtoCart', async (req, res) => {
    
      const query = { _id:new ObjectId(req.body.loginId)};
      let userData = await userCollection.findOne(query);
      userData.cartData[req.body.itemId] += 1;
      await userCollection.findOneAndUpdate({_id:new ObjectId(req.body.loginId)},{$set:{cartData:userData.cartData}})
      res.send('added')
    })
    app.post('/getCart',async(req,res)=>{
      const query = { _id:new ObjectId(req.body.loginId)};
      let userData = await userCollection.findOne(query);
      res.json(userData.cartData);
    })
    //removed cart
    app.post('/removeformCart', async (req, res) => {
      console.log(req.body)
      const query = { _id:new ObjectId(req.body.loginId)};
      let userData = await userCollection.findOne(query);
      if(userData.cartData[req.body.itemId]>0){
        userData.cartData[req.body.itemId] -= 1;
        await userCollection.findOneAndUpdate({_id:new ObjectId(req.body.loginId)},{$set:{cartData:userData.cartData}})
        res.send('removed')
      }
      
    })
    app.post('/getUserByEmail', async (req, res) => {
      const findQuery = { email: req.body.email, password: req.body.password };
      const find = await userCollection.findOne(findQuery);
      if (find) {
        const query = { email: req.body.email, password: req.body.password };
        const result = await userCollection.findOne(query);
        res.send(result);
      } else {
        res.send(false);
      }

    })


   
    //get login user
    app.get('/User', async (req, res) => {
      // const id = req.query.id;
      // const query = { _id: new ObjectId(id) };
      const query = {}
      const result = await userCollection.find(query).toArray();
      res.send(result);

    })
    // Creating api for getting all products
    app.get('/allproducts', async (req, res) => {
      const query = {};
      const products = await productCategoryCollection.find(query).toArray();
      res.send(products)
    });
   

  } finally {

  }
}
run().catch(error => console.log(error));
app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})