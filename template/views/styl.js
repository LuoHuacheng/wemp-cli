module.exports = options => `/* ${options.dir}/${options.name}/${options.name}.styl */
.t${options.name}
  box-sizing border-box
`;
