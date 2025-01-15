import express from "express"
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import { rateLimit } from "express-rate-limit"
import { fileTypeFromBuffer } from 'file-type';

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 40, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const app = express();

app.use(cors());

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  })); 
// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use(limiter)

app.get("/", (req, res) => {
    res.send("Hello World")
})

// Set up multer to store files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  });

app.post("/upload", upload.single('file'), async (req, res) =>{

    console.log(req.file)
    console.log(req.body)

    const mime = (await fileTypeFromBuffer(req.file!.buffer))?.mime
    console.log(req.file)
    if(req.file == undefined || mime !== "image/png"){
        console.log("invalid format")
        res.send("Invalid format")
        return
    }

    res.send("Uploaded")
})

app.listen(3001, () =>{console.log("listening on port 3000")})