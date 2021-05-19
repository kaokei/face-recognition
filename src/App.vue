<template>
  <div id="app">
    <WebCam
      @takePicture="takePicture"
      :matchImages="fileList"
      class="webcam-container"
    ></WebCam>

    <div class="picture-container">
      <a-upload :before-upload="beforeUpload" :showUploadList="false">
        <a-button
          class="btn-upload-picture"
          type="primary"
          shape="round"
          icon="upload"
          size="large"
          >上传照片</a-button
        >
      </a-upload>
      <div>
        <div class="card-box" v-for="item in fileList" :key="item.uid">
          <div>照片{{ item.uid }} {{ item.name }}</div>
          <div>
            {{
              item.status === "success"
                ? "识别成功"
                : item.status === "error"
                ? "识别失败"
                : ""
            }}
          </div>
          <div>左侧视频与当前图片距离：{{ item.distance }}</div>
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
import * as faceapi from "face-api.js";
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
      defaultFileList: [
        "/images/g1.jpeg",
        "/images/g2.jpeg",
        "/images/g3.jpeg",
        "/images/g4.jpeg",
        "/images/g5.jpeg",
        "/images/b1.jpeg",
        "/images/b2.jpeg",
        "/images/b3.jpeg",
        "/images/b4.jpeg",
        "/images/b5.jpeg",
      ],
      fileList: [],
      previewVisible: false,
      previewImage: "",
    };
  },
  mounted() {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      this.defaultFileList.forEach(async (image) => {
        this.fileList.push(await this.getFileObj(image));
      });
    });
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
      const index = this.fileList.indexOf(file);
      const newFileList = this.fileList.slice();
      newFileList.splice(index, 1);
      this.fileList = newFileList;
    },
    async beforeUpload(file) {
      const obj = await this.getFileObj(file);
      this.fileList = [...this.fileList, obj];
      return Promise.reject();
    },
    async takePicture(image) {
      const obj = await this.getFileObj(image);
      this.fileList = [...this.fileList, obj];
    },
    async getFileObj(file) {
      const isString = typeof file === "string" ? true : false;
      const imgObj = isString
        ? await this.getImageObjFromUrl(file)
        : await this.getImageObjFromFile(file);
      const res = {
        uid: uid(),
        name: file.name || "take picture",
        url: isString ? file : imgObj.src,
        descriptor: "",
        status: "",
        distance: -1,
      };
      faceapi
        .detectSingleFace(imgObj, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()
        .then((result) => {
          if (result && result.descriptor) {
            res.descriptor = result.descriptor;
            res.status = "success";
            console.log("识别成功");
          } else {
            res.status = "error";
            console.log("识别失败");
          }
        });
      return res;
    },
    getImageObjFromFile(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener(
          "load",
          function () {
            var image = new Image();
            image.height = 240;
            image.title = file.name;
            image.src = this.result;
            resolve(image);
          },
          false
        );
        reader.readAsDataURL(file);
      });
    },
    getImageObjFromUrl(imageUrl) {
      return new Promise((resolve) => {
        const image = new Image();
        image.addEventListener("load", function () {
          console.log("image loaded success");
          resolve(image);
        });
        image.height = 240;
        image.title = "take picture";
        image.src = imageUrl;
      });
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
