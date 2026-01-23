/**
 * Custom Jest resolver to handle .js extensions in TypeScript imports
 * Strips .js extensions from relative/absolute imports so Jest can resolve .ts files
 * Leaves node_modules imports untouched
 */
module.exports = (path, options) => {
  // Only strip .js from relative/absolute paths, not node_modules
  const isRelativeOrAbsolute = path.startsWith('.') || path.startsWith('/') || path.match(/^[A-Za-z]:\\/);
  const pathToResolve = (isRelativeOrAbsolute && path.endsWith('.js'))
    ? path.replace(/\.js$/, '')
    : path;

  // Use default Jest resolver with the modified path
  return options.defaultResolver(pathToResolve, options);
};
