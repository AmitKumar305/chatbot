const processedFiles = new Set();
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { generateEmbeddings } = require("./embeddings.js");
const { addToIndex } = require("./vectorStore.js");

const processFiles = async () => {
    const folderPath = path.join(__dirname, "pdf-folder");
    if (!fs.existsSync(folderPath)) {
        console.warn("Folder does not exist");
        return;
    }

    const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".pdf") || file.endsWith(".txt"));
    if (files.length === 0) {
        console.warn("No valid files found in the folder");
        return;
    }

    for (const fileName of files) {
        if (processedFiles.has(fileName)) continue; // Skip already processed files

        const filePath = path.join(folderPath, fileName);
        let text = "";

        if (fileName.endsWith(".pdf")) {
            const data = await pdfParse(fs.readFileSync(filePath));
            text = data.text;
        } else {
            text = fs.readFileSync(filePath, "utf-8");
        }

        if (!text.trim()) {
            console.warn(`No extractable text found in ${fileName}, skipping.`);
            continue;
        }

        const embedding = await generateEmbeddings(text);
        await addToIndex(embedding, text);
        processedFiles.add(fileName);
    }
};

// Run file processing on startup
module.exports = processFiles;
