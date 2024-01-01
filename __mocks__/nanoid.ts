let counter = 0;

// Nanois is a mess with esm an modules..
module.exports = {
  nanoid: () => `testid-${counter++}`,
  customAlphabet: () => () => `testid-${counter++}`,
};
