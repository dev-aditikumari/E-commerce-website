// The database stores image file names ("product_12.png"); this finds the bundled file.
// require.context only exists inside the webpack build, so under the test runner it stays null.
let images = null;
try {
  images = require.context("../components/Assets", false, /\.png$/);
} catch {
  images = null;
}

export const productImage = (file) => {
  if (!images) return file;
  try {
    return images(`./${file}`);
  } catch {
    return images("./logo_big.png");
  }
};
