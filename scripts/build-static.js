const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const dist = path.join(root, "dist");

const copies = [
  ["index.html", "index.html"],
  ["src", "src"],
  ["public", "public"],
  ["Flyer Templates/Flyer Template.jpg", "Flyer Templates/Flyer Template.jpg"],
  ["Flyer Templates/Flyer Template - 2.jpg", "Flyer Templates/Flyer Template - 2.jpg"],
  ["Flyer Templates/Flyer Template - 3.jpg", "Flyer Templates/Flyer Template - 3.jpg"],
];

function copyRecursive(source, target) {
  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const item of fs.readdirSync(source)) {
      copyRecursive(path.join(source, item), path.join(target, item));
    }
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const [from, to] of copies) {
  copyRecursive(path.join(root, from), path.join(dist, to));
}

console.log("Built static site into dist/");
