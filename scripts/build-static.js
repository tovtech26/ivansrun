const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

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

function resolveBuildCommit() {
  const environmentCommit = String(process.env.COMMIT_REF || process.env.GITHUB_SHA || "").trim();
  if (environmentCommit) return environmentCommit;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const builtIndexPath = path.join(dist, "index.html");
const builtIndex = fs.readFileSync(builtIndexPath, "utf8").replace("__BUILD_COMMIT__", resolveBuildCommit());
fs.writeFileSync(builtIndexPath, builtIndex);

console.log("Built static site into dist/");
