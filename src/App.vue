<template>
  <div id="app">
    <a-row type="flex" align="top">
      <a-col flex="750px">
        <WebCam @takePicture="takePicture"></WebCam>
      </a-col>
      <a-col flex="auto">
        <a-upload :file-list="fileList" :before-upload="beforeUpload">
          <a-button type="primary" shape="round" icon="upload" size="large"
            >上传照片</a-button
          >
        </a-upload>
      </a-col>
    </a-row>
    <a-modal :visible="previewVisible" :footer="null" @cancel="handleCancel">
      <img alt="example" style="width: 100%" :src="previewImage" />
    </a-modal>
  </div>
</template>

<script>
import WebCam from "./components/WebCam.vue";

function convertFileToImage(file) {}

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
      getBase64(file).then((url) => {
        file.thumbUrl = url;
        this.fileList = [...this.fileList, file];
      });
      console.log("this.fileList :>> ", this.fileList);
      return false;
    },
    takePicture(image) {
      console.log("take Picture :>> ", image);
      this.fileList = [
        ...this.fileList,
        {
          uid: uid(),
          name: "take picture",
          status: "done",
          url: image,
          thumbUrl: image,
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
</style>
