// const { pipeline } = require("@xenova/transformers");
const TransformersApi = Function('return import("@xenova/transformers")')();

let embedder;
(async () => {
    const { pipeline } = await TransformersApi;
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
})();

const generateEmbeddings = async (text) => {
    if (!embedder) {
        throw new Error("Embedder not initialized");
    }
    const embeddings = await embedder(text, { pooling: "mean", normalize: true });
    return embeddings.data;
};

module.exports = {
    generateEmbeddings
}
