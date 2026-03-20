const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const torrents = process.env.TORRENTS_PATH || "/data/Torrents";
const series   = process.env.SERIES_PATH   || "/data/Media/Series";
const films    = process.env.FILMS_PATH    || "/data/Media/Films_Test";

// LOGS DE DÉBOGAGE au démarrage
console.log("Chemins configurés :");
console.log("- Torrents:", torrents, " Existe:", fs.existsSync(torrents));
console.log("- Series:", series, " Existe:", fs.existsSync(series));

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

function getMainFile(dir) {
    const files = fs.readdirSync(dir);
    let biggestFile = null;
    let maxWeight = 0;

    files.forEach(f => {
        const fullPath = path.join(dir, f);
        const stats = fs.statSync(fullPath);

        if (stats.isFile()) {
            // On vérifie si c'est une vidéo (mp4, mkv, avi...)
            const ext = path.extname(f).toLowerCase();
            const videoExts = [".mkv", ".mp4", ".avi", ".mov"];
            
            if (videoExts.includes(ext) && stats.size > maxWeight) {
                maxWeight = stats.size;
                biggestFile = f;
            }
        } else if (stats.isDirectory()) {
            // Optionnel : tu peux chercher dans les sous-dossiers ici si besoin
        }
    });
    return biggestFile;
}

function listFiles(dir) {
    let hidden = getHidden();
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir).filter(f => {
        const full = path.join(dir, f);
        if (hidden.includes(f) || autoHide.includes(f)) return false;

        const stats = fs.statSync(full);
        
        if (stats.isDirectory()) {
            const video = getMainFile(full);
            return video !== null; // On ne garde le dossier que s'il contient une vidéo
        }
        
        return stats.isFile();
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
