const { mkdirSync, writeFileSync } = require("fs");
const { join } = require("path");
const { cwd } = require("process");

console.log(process.argv);

const [postName] = process.argv.slice(2);
const indexPugTemplate = (title) =>
`extends ./../../_layout.pug

block title
  title ${title}

block content
  include:markdown-it content.md
`;

const title = postName
  .split("-")
  .map((x) => x.replace(x[0], x[0].toUpperCase()))
  .join(" ");

const folder = join(cwd(), `./src/posts/${postName}`);

mkdirSync(folder);
writeFileSync(`${folder}/index.pug`, indexPugTemplate(title));
writeFileSync(`${folder}/content.md`, "");
