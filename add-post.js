const { mkdirSync, writeFileSync } = require("fs");
const { join } = require("path");
const { cwd } = require("process");

const indexPugTemplate = (title, folder) =>
  `extends ./../../_layout.pug

block variables
  - var title = ${title}
  - var description = 'DESCRIPTION'
  - var keywords = 'KEYWORDS'
  - var canonical = '${folder}/index.html'

block content
  article
    include:markdown-it content.md
`;

const generateTitleName = (postName) =>
  postName
    .split("-")
    .map((x) => x.replace(x[0], x[0].toUpperCase()))
    .join(" ");

const [postName, titleName] = process.argv.slice(2);
const title = titleName || generateTitleName(postName);
const folder = join(cwd(), `./src/posts/${postName}`);

mkdirSync(folder);
writeFileSync(`${folder}/index.pug`, indexPugTemplate(title, folder));
writeFileSync(`${folder}/content.md`, "");
