const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { createIndex, searchIndex } = require("./vectorStore.js");
const { generateEmbeddings } = require("./embeddings.js");
const processFiles = require("./processFiles.js");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

createIndex();
processFiles();

// Query Chatbot
app.post("/api/query", async (req, res) => {

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

app.get('/', (req, res) => {
    res.send('<h1>Server is running</h1>');
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
