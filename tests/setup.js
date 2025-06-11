//tests/setup.js
const canvas = require('canvas');
const { createCanvas, Image } = canvas;
global.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') {
    const ctx = createCanvas(300, 150).getContext('2d');
    return ctx;
  }
  throw new Error(`Context type ${type} not supported`);
};
global.Image = Image;