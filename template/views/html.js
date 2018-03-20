module.exports = options => `<!--${options.dir}/${options.name}/${options.name}.wxml-->
<view class="container">
  <text class="title">{{ title }}</text>
</view>
`;
