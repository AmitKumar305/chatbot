import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import axios from "axios";
import pdfParse from "pdf-parse";
import { Ollama } from "ollama-node";
import { createIndex, addToIndex, searchIndex } from "./vectorStore.js";
import { generateEmbeddings } from "./embeddings.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;
const ollama = new Ollama();

const upload = multer({ dest: "uploads/" });

app.use(express.json());

// Initialize FAISS vector store
createIndex();

// File Upload & Text Processing
const folderPath = path.join(__dirname, "pdf-folder"); // Adjust folder path

app.post("/api/upload", async (req, res) => {
    if (!fs.existsSync(folderPath)) {
        return res.status(400).json({ error: "Folder does not exist" });
    }

    const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".pdf") || file.endsWith(".txt"));
    if (files.length === 0) {
        return res.status(400).json({ error: "No valid files found in the folder" });
    }

    const processedFiles = [];

    for (const fileName of files) {
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
            continue; // Skip empty files
        }

        const embedding = await generateEmbeddings(text);
        await addToIndex(embedding, text);
        processedFiles.push(fileName);
    }

    if (processedFiles.length === 0) {
        return res.status(400).json({ error: "No files were successfully processed" });
    }

    res.json({ message: "Files processed and stored", files: processedFiles });
});

// Query Chatbot
app.post("/api/query", async (req, res) => {


    if (!fs.existsSync(folderPath)) {
        return res.status(400).json({ error: "Folder does not exist" });
    }

    const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".pdf") || file.endsWith(".txt"));
    if (files.length === 0) {
        return res.status(400).json({ error: "No valid files found in the folder" });
    }

    const processedFiles = [];

    for (const fileName of files) {
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
            continue; // Skip empty files
        }

        const embedding = await generateEmbeddings(text);
        await addToIndex(embedding, text);
        processedFiles.push(fileName);
    }

    if (processedFiles.length === 0) {
        return res.status(400).json({ error: "No files were successfully processed" });
    }


    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    const embedding = await generateEmbeddings(question);
    const relevantTexts = await searchIndex(embedding);

    if (!relevantTexts.length) return res.json({ answer: "No relevant information found" });

    const context = relevantTexts.join("\n");

    
    const cleanedContext = context
    .replace(/\n+/g, ' ') // Remove excessive newlines
    .replace(/\s+/g, ' ') // Remove excessive spaces
    .trim();

    // console.log(cleanedContext);

    const apiKey = process.env.VITE_API_KEY;
    const apiUrl = process.env.VITE_API_URL;

    const url = `${apiUrl}?key=${apiKey}`;

    const input = `use this context ${cleanedContext} to answer this question. Question: ${question}`;

    const data = {
        contents: [
            {
                parts: [{ text: input }],
            },
        ],
    };
    try {
        const response = await axios.post(url, data);
        console.log(
            'AI resposne: ',
            response.data.candidates[0].content.parts[0].text,
        );
        res.json({
            message: 'Details fetched successfully',
            data: response.data.candidates[0].content.parts[0].text,
        })
    } catch (err){
        console.log('Error while getting response from api');
        console.log(err);
    }

});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
