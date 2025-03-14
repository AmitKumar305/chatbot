import { pipeline } from "@xenova/transformers";

let embedder;
(async () => {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
})();

export const generateEmbeddings = async (text) => {
    if (!embedder) {
        throw new Error("Embedder not initialized");
    }
    const embeddings = await embedder(text, { pooling: "mean", normalize: true });
    return embeddings.data;
};
