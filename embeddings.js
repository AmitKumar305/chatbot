const TransformersApi = Function('return import("@xenova/transformers")')();

let embedderPromise = (async () => {
    const { pipeline } = await TransformersApi;
    return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
})();

const generateEmbeddings = async (text) => {
    const embedder = await embedderPromise; // Ensure it's initialized before use
    const embeddings = await embedder(text, { pooling: "mean", normalize: true });
    return embeddings.data;
};

module.exports = {
    generateEmbeddings
};
