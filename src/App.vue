<script lang="ts">
export default {
  onLaunch() {
    console.info("Project Ahang uni-app launched");
  },
};
</script>

<style>
page {
  min-height: 100%;
  background: #faf8f5;
  color: #2a2825;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.625;
}

view,
scroll-view,
text,
image,
button,
input,
textarea,
picker,
swiper,
swiper-item {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: inherit;
}

button::after {
  border: 0;
}

input,
textarea {
  font: inherit;
}
</style>
