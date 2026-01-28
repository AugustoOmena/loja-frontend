import fs from "fs";

const INPUT_FILE = "./lojaloja.json";
const OUTPUT_FILE = "./products-duplicated.json";

const MULTIPLIER = 50;

// lê JSON original
const raw = fs.readFileSync(INPUT_FILE, "utf-8");
const data = JSON.parse(raw);

// encontra maior ID existente
let maxId = 0;
for (const item of data) {
  if (item && typeof item.id === "number") {
    if (item.id > maxId) maxId = item.id;
  }
}

let nextId = maxId + 1;

// separa nulls e produtos
const products = [];
const nulls = [];

data.forEach((item, index) => {
  if (item === null) {
    nulls.push({ index });
  } else {
    products.push(item);
  }
});

// duplica produtos
const duplicated = [];

for (const item of products) {
  // original
  duplicated.push(item);

  // cópias
  for (let i = 0; i < MULTIPLIER; i++) {
    const clone = structuredClone(item);
    clone.id = nextId++;
    duplicated.push(clone);
  }
}

// 🔀 Fisher-Yates shuffle (realmente aleatório)
for (let i = duplicated.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [duplicated[i], duplicated[j]] = [duplicated[j], duplicated[i]];
}

// remonta o array final preservando nulls
const result = [];
let productIndex = 0;

const totalLength = duplicated.length + nulls.length;

for (let i = 0; i < totalLength; i++) {
  const nullAtIndex = nulls.find(n => n.index === i);

  if (nullAtIndex) {
    result.push(null);
  } else {
    result.push(duplicated[productIndex++]);
  }
}

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(result, null, 2),
  "utf-8"
);

console.log("✅ Produtos duplicados, embaralhados e prontos!");
console.log(`📦 Arquivo gerado: ${OUTPUT_FILE}`);
console.log(`🔢 Total de produtos: ${duplicated.length}`);