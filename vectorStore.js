import faiss from "faiss-node";
import fs from "fs";
import "dotenv/config";

const INDEX_PATH = process.env.FAISS_INDEX;
let index;

export const createIndex = () => {
    if (fs.existsSync(INDEX_PATH)) {
        index = faiss.readIndex(INDEX_PATH);
    } else {
        index = new faiss.IndexFlatL2(384); // 384-D vector (MiniLM model)
    }
};

export const addToIndex = async (embedding, text) => {
    const id = index.ntotal();  // Current vector count as ID
    index.add(Array.from(embedding));  // FAISS requires 2D array
    fs.writeFileSync(`indexes/${INDEX_PATH}_${id}.txt`, text);  // Store text
    console.log("Total vectors after adding:", index.ntotal());
};

export const searchIndex = async (queryEmbedding) => {
    console.log("Total vectors in index:", index.ntotal());

    const data = index.search(Array.from(queryEmbedding), 1); // Top 1 match

    const relevantIds = data.labels.filter((id) => id !== -1);

    const results = relevantIds.map((id) => {
        const filePath = `indexes/${INDEX_PATH}_${id}.txt`;
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return null;
        }
        return fs.readFileSync(filePath, "utf-8");
    }).filter(Boolean); // Remove null values
    return results;
};




















// import faiss from "faiss-node";
// import fs from "fs";
// import "dotenv/config";
// // console.log(Object.keys(faiss));

// const INDEX_PATH = process.env.FAISS_INDEX;
// let index;

// export const createIndex = () => {
//     if (fs.existsSync(INDEX_PATH)) {
//         index = faiss.readIndex(INDEX_PATH);
//     } else {
//         index = new faiss.IndexFlatL2(384); // 384-D vector (MiniLM model)
//     }
// };

// export const addToIndex = async (embedding, text) => {
//     const id = index.ntotal;
//     index.add(Array.from(embedding));
//     fs.writeFileSync(`${INDEX_PATH}_${index.ntotal()}.txt`, text);
//     console.log(index.ntotal());
// };

// export const searchIndex = async (queryEmbedding) => {
//     console.log("Total vectors in index:", index.ntotal());
//     console.log("Query embedding length:", queryEmbedding.length);


//     const data = index.search(Array.from(queryEmbedding), 1); // Top 3 matches
//     console.log(data);
//     const relevantIds = data.labels.filter((id) => id !== -1);
//     console.log("Relevant IDs:", relevantIds);

//     const results = relevantIds.map((id) => {
//         const filePath = `${INDEX_PATH}_1.txt`;
//         // const filePath = `${INDEX_PATH}_${id}.txt`;
//         if (!fs.existsSync(filePath)) {
//           console.warn(`File not found: ${filePath}`);
//           return null;
//         }
//         return fs.readFileSync(filePath, "utf-8");
//       }).filter(Boolean); // Remove null values
      
//       console.log("Relevant Data:", results);
//       return results;
      

// };
