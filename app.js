const path = require("path");
const fs = require("fs");
const express = require("express");
const jetpack = require("fs-jetpack");
const yaml = require('js-yaml');
let port = 3000;

const app = express();
if(process.env.NODE_ENV === 'dev'){
  const livereload = require("livereload");
  const connectLivereload = require("connect-livereload");
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, "views"));

  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      pagetodebug = "/"+""
      liveReloadServer.refresh(pagetodebug);
    }, 50);
  });
  app.use(connectLivereload());
}

let foldersource, folderoutput
// app.use(cors())
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

try{
  var filename = path.join(__dirname, './settings.yml'),
  contents = fs.readFileSync(filename, 'utf8'),
  datayaml     = yaml.load(contents);
  port = datayaml.app.port  
  foldersource = datayaml.app.foldersource
  folderoutput = datayaml.app.folderoutput
}catch(err){
  console.log(err)

}

app.use('/assets', express.static('assets'))
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/file", (req, res) => {
  res.render("file", { title: "file" });
});

app.get("/bt", (req, res) => {
  res.render("bt", { title: "file" });
});


app.get('/static', async (req, res, next) => {
  try {
    let loc = req.query.loc
    let type = req.query.type
    loc = path.join(__dirname,foldersource, loc)

    if(jetpack.exists(loc)){
      res.sendFile(loc);
    }else{
      res.status(500).json({success:false})
    }

  } catch (err) { next(err)}
});


app.get("/allfiles", (req, res) => {
  // let files = jetpack.find(foldersource, { matching:"/**/*.pdf" });
  let files = jetpack.find(foldersource, { matching:"**/*.pdf" });
  for (var i1 = files.length - 1; i1 >= 0; i1--) {
    // let loc = files[i1]
    let loc = files[i1].split("\\").splice(2,2).join("/")
    let name = loc
    // let arloc = loc.split("/")
    // let name = arloc[arloc.length-1]
    files[i1] = {loc:loc,name:name}
  }
  return res.status(200).json({success:true,rows:files})
});

app.get("/readyfiles", (req, res) => {
  // let files = jetpack.find(foldersource, { matching:"/**/*.pdf" });
  let files = jetpack.find(folderoutput, { matching:"**/*.pdf" });
  for (var i1 = files.length - 1; i1 >= 0; i1--) {
    loc = files[i1].split("\\").splice(2,2).join("/")
    files[i1] = {loc:loc,name:loc}
  }
  return res.status(200).json({success:true,rows:files})
});

app.post("/rename", (req, res) => {
  const data = req.body
  // console.log(data)

  source = path.join(foldersource, data.source)
  dest = path.join(folderoutput, data.dest)
  // console.log(source,dest)
  if(jetpack.exists(source)){
    jetpack.move(source, dest);
    return res.status(200).json({success:true,rows:dest})
  }else{
    return res.status(500).json({success:false,message:"Not Exists"})
  }
});

app.post('/rxw', async (req, res, next) => {
  try {
    let osnya = os.platform()
    const obj = req.body.data
    if(osnya=='win32'){ 
      let strobj = JSON.stringify(obj)
      strobj = JSON.stringify(strobj)
      if(strobj.indexOf("^")>-1){
        strobj = strobj.split("^").join("^^")
      }
      if(strobj.indexOf("&")>-1){
        strobj = strobj.split("&").join("^&")
      }
      if(strobj.indexOf(">")>-1){
        strobj = strobj.split(">").join("^>")
      }
      if(strobj.indexOf("<")>-1){
        strobj = strobj.split("<").join("^<")
      }
      // jetpack.write( batloc, '"'+globalval.wrkrlocation+'" '+strobj+' \n exit')
      // exec('start "" "'+batloc+'"')
      exec(`start "" "node.exe wrkr ${strobj}`)
    }     
    res.json({ "Success": true })
  } catch (err) {
    next(err)
  }
});

//listen for requests
app.listen(port, () => {
  console.log(`Server is  listening at http://localhost:${port}`);
});