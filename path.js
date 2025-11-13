import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

console.log(__filename)
const __dirname = path.dirname(__filename);
console.log(__dirname);

const pathname = path.join(__dirname , "satyam/feature/about");
console.log(pathname);

const filename = "index.js"
const isAbsoulate = path.isAbsolute(filename);
console.log(isAbsoulate);