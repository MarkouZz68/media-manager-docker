const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const torrents = process.env.TORRENTS_PATH || "/data/torrents";
const series   = process.env.SERIES_PATH   || "/data/series";
const films    = process.env.FILMS_PATH    || "/data/films";

// auto hide
const autoHide = ["Media-Manager.lnk"];
const autoHideExt = [".lnk"];

// hidden file
const hiddenFile = "/app/config/hidden.json";

// Ajoute cette sécurité pour créer le dossier s'il n'existe pas
const configDir = path.dirname(hiddenFile);
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

if (!fs.existsSync(hiddenFile)) {
    fs.writeFileSync(hiddenFile, JSON.stringify([]));
}

function getHidden(){
    return JSON.parse(fs.readFileSync(hiddenFile));
}

function saveHidden(list){
    fs.writeFileSync(hiddenFile, JSON.stringify(list, null, 2));
}

// list files
function listFiles(dir){

    let hidden = getHidden();

    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir).filter(f => {

        const full = path.join(dir,f);
        const ext = path.extname(f).toLowerCase();

        if (!fs.statSync(full).isFile()) return false;

        if (autoHide.includes(f)) return false;

        if (autoHideExt.includes(ext)) return false;

        if (hidden.includes(f)) return false;

        return true;

    });
}

// list folders
function listFolders(dir){
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir).filter(f =>
        fs.statSync(path.join(dir,f)).isDirectory()
    );
}

// API
app.get("/files",(req,res)=>{
    res.json({
        torrents: listFiles(torrents),
        series: listFolders(series)
    });
});

// MOVE
app.post("/move",(req,res)=>{
    try{
        const {file,type,destFolder} = req.body;

        const src = path.join(torrents,file);
        let dest;

        if(type === "series"){
            dest = path.join(series,destFolder,file);
        }else{
            dest = path.join(films,file);
        }

        const destDir = path.dirname(dest);

        if(!fs.existsSync(destDir)){
            fs.mkdirSync(destDir,{recursive:true});
        }

        fs.renameSync(src,dest);

        res.json({ok:true});

    }catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

// DELETE
app.post("/delete",(req,res)=>{
    try{
        const {file} = req.body;

        fs.unlinkSync(path.join(torrents,file));

        res.json({ok:true});

    }catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

// CLEAN
const unwanted = [".exe",".ts",".url",".nfo",".txt"];

app.post("/clean",(req,res)=>{
    try{

        if (!fs.existsSync(torrents)) return res.json({ok:true});

        let files = fs.readdirSync(torrents);

        files.forEach(f=>{
            let ext = path.extname(f).toLowerCase();

            if(unwanted.includes(ext)){
                fs.unlinkSync(path.join(torrents,f));
            }
        });

        res.json({ok:true});

    }catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

app.listen(3000,()=>{
    console.log("Server running on http://localhost:3000");
});
