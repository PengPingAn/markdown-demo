<script setup lang="ts"></script>

<template>
  <router-view></router-view>
</template>

<style>
body:before {
  /* 设置边框样式 */
  border: 1px solid #ccc;
  /* 添加阴影效果 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  /* 设置内边距 */
  padding: 20px;
  /* 使用渐变实现纸张颜色 */
  background-image: linear-gradient(180deg, #fefde8 0%, #fff 100%);
  /* 引入斑驳纹理图像，并设置重复方式和透明度 */
  background-image: url("/src/assets/bgImg.png"),
    linear-gradient(180deg, #fefde8 0%, #fff 100%);
  background-repeat: repeat;
  background-position: center center;
  background-size: auto, cover;
  opacity: 0.04;
  inset: 0;
  position: fixed;
  content: "";
  z-index: -999;
}
</style>
