const { JSDOM } = require("jsdom");
const { languages, highlight } = require("prismjs");
require("prismjs/components/prism-json");
require("prismjs/components/prism-bash");
require("prismjs/components/prism-typescript");

const getLang = (className) => {
  switch (className) {
    case "language-json":
      return "json";
    case "language-javascript":
    case "language-js":
      return "javascript";
    case "language-typescript":
      return "typescript";
    case "language-cmd":
      return "shell";
    case "language-html":
    case "language-xml":
      return "markup";
    default:
      return undefined;
  }
};

module.exports = {
  locals: {
    ci: process.env.CI,
  },
  filters: {
    highlight: function (text, options) {
      const dom = new JSDOM(`<!DOCTYPE html><body>${text}</body>`);
      const codeBlocks = [...dom.window.document.querySelectorAll("code")];

      const isCodeBlocksFound = codeBlocks.length;

      if (!isCodeBlocksFound) {
        return text;
      }

      codeBlocks.forEach((node) => {
        const code = node.textContent;
        const maybeLanguage = node.className;

        const language = getLang(maybeLanguage);

        if (language) {
          node.innerHTML = highlight(code, languages[language], language);
        }
      });

      const result = dom.window.document.body.innerHTML;

      return result;
    },
  },
};
