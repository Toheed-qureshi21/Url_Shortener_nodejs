import { readFile,writeFile } from "fs/promises";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import crypto from"crypto"
import { link } from "fs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const DATA_FILE = path.join(__dirname,"data","links.json");
const servesFile = async(res,filpath,type) => {
    try {     
             const data = await readFile(filpath);
             res.writeHead(200, { 'Content-Type': type });
             res.end(data);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("Something went wrong");
        console.error(error);
    }
}
const loadlinks = async() => {
  try {
        const data = await readFile(DATA_FILE,"utf-8");
        return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
        await writeFile(DATA_FILE, JSON.stringify({}));
        return {}; // Return empty object for non-existent file
    }
    console.error("Error loading links:", error);
    throw error;
}

}
const saveLinks = async(links) => {
  await writeFile(DATA_FILE,JSON.stringify(links));
}


const server = createServer(async(req, res) => {
    if (req.method === "GET") {
        if (req.url === "/") {
           servesFile(res,path.join(__dirname,"index.html"),"text/html");
          
        }
        else if(req.url==="/style.css"){
            servesFile(res,path.join(__dirname,"style.css"),"text/css");
        } 
        else if (req.url==="/links") {
            const links = await loadlinks();

            res.writeHead(200,{"Content-Type":"application/json"});
            return res.end(JSON.stringify(links));
        }
        else {
            const links = await loadlinks();
        
            const shortCode = req.url.slice(1);
            if (links[shortCode]) {
                res.writeHead(302,{location:links[shortCode]});
                res.end();
            }
            else{
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not found");
            }
        }
    }
   else if (req.method==="POST" && req.url==="/shorten") {
        let body = "";
        req.on("data",(chunk)=>{
                body += chunk;
        });
        req.on("end",async()=>{ 
           let links = await loadlinks();
            const {url,short_url} = JSON.parse(body);
            //!Checking for duplicates of short_url
            const finalShortCode = short_url || crypto.randomBytes(4).toString("hex");
            if(!url){
                res.writeHead(400,{"Content-Type":"text/plain"});
                return res.end("Url is required");
            }
            if (links[finalShortCode]) {
                res.writeHead(409,{"Content-Type":"text/plain"});
                return res.end("Existing url mat dalo");
            }
            links[finalShortCode] = url;
            await saveLinks(links);
            res.writeHead(201,{"Content-Type":"application/json"})
            res.end(JSON.stringify({success:true,short_url: finalShortCode }));
        })  
        
    }
    else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Method not allowed");
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
