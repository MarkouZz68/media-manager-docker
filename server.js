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

// Liste des extensions vidéo valides
const videoExtensions = [".mkv", ".mp4", ".avi", ".mov", ".m4v"];

function getFirstVideoRecursive(dir, baseDir = dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath);

        if (stats.isDirectory()) {
            // On fouille dans le sous-dossier
            const found = getFirstVideoRecursive(fullPath, baseDir);
            if (found) return found;
        } else {
            const ext = path.extname(item).toLowerCase();
            if (videoExtensions.includes(ext)) {
                // On a trouvé une vidéo ! On renvoie son chemin relatif au dossier Torrents
                return relativePath;
            }
        }
    }
    return null;
}

function listFiles(dir) {
    let hidden = getHidden();
    if (!fs.existsSync(dir)) return [];

    // On récupère tout le contenu du dossier Torrents
    const rootItems = fs.readdirSync(dir);

    const results = [];

    rootItems.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        // Filtres d'exclusion (cachés, lnk, etc.)
        if (hidden.includes(item) || autoHide.includes(item) || autoHideExt.includes(path.extname(item).toLowerCase())) {
            return;
        }

        if (stats.isFile()) {
            // C'est un fichier à la racine, on l'ajoute si c'est une vidéo
            if (videoExtensions.includes(path.extname(item).toLowerCase())) {
                results.push(item);
            }
        } else if (stats.isDirectory()) {
            // C'est un dossier, on cherche la vidéo à l'intérieur
            const videoSubPath = getFirstVideoRecursive(fullPath, dir);
            if (videoSubPath) {
                // On ajoute le chemin relatif (ex: "Dossier_Twitch/video.mkv")
                results.push(videoSubPath);
            }
        }
    });

    return results;
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
