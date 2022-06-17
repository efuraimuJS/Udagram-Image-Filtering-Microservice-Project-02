require("dotenv").config();
const db_manager = require("./config/database");

const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

import express, { Request, Response } from "express";
import bodyParser from "body-parser";

const User = require("./model/user")
const auth = require('./middleware/auth')
import { filterImageFromURL, deleteLocalFiles } from "./util/util";

(async () => {
  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  app.get("/filteredimage/", auth, (req: Request, res: Response) => {
    let { image_url } = req.query;
    if (!image_url) {
      return res.status(400).send("image_url is required");
    }
    filterImageFromURL(image_url)
      .then((imagePath) => {
        return res.status(200).sendFile(imagePath, (err) => {
          if (!err) {
            let filesList: string[] = [imagePath];
            deleteLocalFiles(filesList);
          }
        });
      })
      .catch(() => {
        return res.status(422).send("error when processing the image");
      });
  });

  //! END @TODO1

  // Root Endpoint
  // Displays a simple message to the user
  app.get("/", async (_req: Request, res: Response) => {
    res.send("try GET /filteredimage?image_url={{}}");
  });

  app.post('/register', async (req, res)=>{
    try {
      const{first_name, last_name, email, password} = req.body
      if(!(email && password && first_name && last_name)){
        return res.status(400).send('All input is required')
      }
      const oldUser = await User.findOne({email})
        if(oldUser){
          return res.status(409).send("User Already Exist. Please Login");
        }
          let encryptedPassword = await bcrypt.hash(password, 10);

          const user = await User.create({
            first_name,
            last_name,
            email: email.toLowerCase(),
            password: encryptedPassword
          })
      
          const token = jwt.sign(
            {user_id: user._id, email},
            process.env.TOKEN_KEY,{
              expiresIn: 604800
            }
          )
          user.token = token
          res.status(201).json(user)
          return;
    } catch (error) {
      console.log(error)
    }
  })
  app.post('/login', async (req, res)=>{
    try {
      const {email, password} = req.body

    if(!(email && password)){
     return res.status(400).send('All input is required')
    }
    const user = await User.findOne({email})
    if(user && (await bcrypt.compare(password, user.password))){
      const token = jwt.sign({
        user_id: user._id, email
      }, process.env.TOKEN_KEY,{expiresIn: 604800})

      user.token = token
      res.status(200).json(user)
      return;
    }
    res.status(400).send('Invalid Credentials')
    } catch (error) {
      console.log(error)
    }

  })

  //Start db & server
  const start = async () => {
    try {
      await db_manager.connect();

      app.listen(port, () => {
        console.log(`server running http://localhost:${port}`);
        console.log(`press CTRL+C to stop server`);
      });
    } catch (error) {
      console.log(error);
    }
  };
  start();
})();
