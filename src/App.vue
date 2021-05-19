<template>
  <div id="app">
    <WebCam @takePicture="takePicture" class="webcam-container"></WebCam>

    <div class="picture-container">
      <a-upload :before-upload="beforeUpload" :showUploadList="false">
        <a-button class="btn-upload-picture" type="primary" shape="round" icon="upload" size="large"
          >上传照片</a-button
        >
      </a-upload>
      <div>
        <div class="card-box" v-for="item in fileList" :key="item.uid">
          <div>照片{{ item.uid }} {{ item.name }}</div>
          <img class="card-image" :src="item.url" :alt="item.name" />
        </div>
      </div>
    </div>

    <a-modal :visible="previewVisible" :footer="null" @cancel="handleCancel">
      <img alt="example" style="width: 100%" :src="previewImage" />
    </a-modal>
  </div>
</template>

<script>
import WebCam from "./components/WebCam.vue";

function convertFileToImage(file) {
  const img = document.createElement("img");
  const src = URL.createObjectURL(file);
  img.src = src;
  img.onload = function () {
    URL.revokeObjectURL(src);
  };
  return img;
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
let __uid = -1;
function uid() {
  return __uid--;
}

export default {
  name: "App",
  components: {
    WebCam,
  },
  data() {
    return {
      fileList: [],
      previewVisible: false,
      previewImage: "",
    };
  },
  methods: {
    async handlePreview(file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj);
      }
      this.previewImage = file.url || file.preview;
      this.previewVisible = true;
    },
    handleCancel() {
      this.previewVisible = false;
    },
    handleRemove(file) {
      console.log("handleRemove :>> ", file);
      const index = this.fileList.indexOf(file);
      const newFileList = this.fileList.slice();
      newFileList.splice(index, 1);
      this.fileList = newFileList;
    },
    beforeUpload(file) {
      console.log("beforeUpload :>> ", file);
      const image = convertFileToImage(file);
      this.fileList = [
        ...this.fileList,
        {
          uid: uid(),
          name: file.name,
          url: image.src,
          image: image,
        },
      ];
      console.log("this.fileList :>> ", this.fileList);
      return false;
    },
    takePicture(image) {
      console.log("take Picture :>> ", image);
      const imgObj = new Image();
      imgObj.src = image;
      this.fileList = [
        ...this.fileList,
        {
          uid: uid(),
          name: "take picture",
          url: image,
          image: imgObj,
        },
      ];
    },
  },
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
}
.webcam-container {
  float: left;
}
.picture-container {
  overflow: hidden;
}
.card-box {
  float: left;
  margin-right: 20px;
  margin-bottom: 20px;
}
.card-image {
  max-height: 240px;
}
.btn-upload-picture {
  margin: 20px 0;
}
</style>
