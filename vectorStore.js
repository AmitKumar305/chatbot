const faiss = require("faiss-node");
const fs = require("fs");
const path = require("path");
require("dotenv/config");

const folderPath = path.join(__dirname, "pdf-folder");

let index;

const createIndex = () => {
    index = new faiss.IndexFlatL2(384);
};

const addToIndex = async (embedding, text) => {
    const id = index.ntotal();
    const files = fs.readdirSync(folderPath);
    if (id < files.length) {
        index.add(Array.from(embedding));
        fs.writeFileSync(`indexes/vector_index_${id}.txt`, text);
        console.log("Total vectors after adding:", index.ntotal());
    }
};

const searchIndex = async (queryEmbedding) => {
    const data = index.search(Array.from(queryEmbedding), 1);

    const relevantIds = data.labels.filter((id) => id !== -1);
    console.log(relevantIds);

    const results = relevantIds.map((id) => {
        const filePath = `indexes/vector_index_${id}.txt`;
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return null;
        }
        return fs.readFileSync(filePath, "utf-8");
    }).filter(Boolean);
    return results;
};

module.exports = {
    createIndex,
    addToIndex,
    searchIndex
}
