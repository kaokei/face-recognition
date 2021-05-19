<template>
  <div class="container">
    <div class="container-inner">
      <video
        ref="videoRef"
        id="video"
        width="720"
        height="500"
        autoplay
        muted
      ></video>
      <canvas ref="canvasRef" id="canvas" class="d-none"></canvas>
      <audio
        ref="snapSoundRef"
        id="snapSound"
        src="snap.wav"
        preload="auto"
      ></audio>
    </div>
    <a-button type="primary" @click="takePicture" class="btn-take-picture"
      >拍照</a-button
    >
    <a-button type="primary" @click="detectPicture" class="btn-detect-picture"
      >人脸匹配</a-button
    >
  </div>
</template>

<script>
import * as faceapi from "face-api.js";
import Webcam from "@/utils/webcam-easy";

export default {
  name: "WebCam",
  props: {
    matchImages: Array,
  },
  data() {
    return {
      video: null,
      canvas: null, // 这个canvas是webcam需要拍照使用的
      detectCanvas: null, // 这个canvas是人脸识别渲染landmarks的
      snapSound: null,
      timer: null,
      webcam: null,
      displaySize: null,
    };
  },
  mounted() {
    this.video = this.$refs["videoRef"];
    this.canvas = this.$refs["canvasRef"];
    this.snapSound = this.$refs["snapSoundRef"];

    this.video.addEventListener("canplaythrough", this.onPlay);

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(this.startVideo);
  },
  destroyed() {
    this.timer &&
      window.cancelAnimationFrame &&
      window.cancelAnimationFrame(this.timer);
    this.video.removeEventListener("play", this.onPlay);
    this.webcam.stop();
  },
  methods: {
    takePicture() {
      this.$emit("takePicture", this.webcam.snap());
    },
    async detectPicture() {
      if (this.matchImages && this.matchImages.length) {
        const results = await faceapi
          .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (!results.length) {
          console.log("人脸识别结果为空");
          return;
        }

        const faceMatcher = new faceapi.FaceMatcher(results);

        this.matchImages.forEach((imageObj) => {
          if (imageObj.descriptor) {
            const bestMatch = faceMatcher.findBestMatch(imageObj.descriptor);
            if (bestMatch) {
              imageObj.distance = bestMatch.distance.toFixed(2);
            }
          }
        });
      } else {
        alert("请先上传图片，或者拍照再进行人脸匹配");
      }
    },
    startVideo() {
      this.webcam = new Webcam(
        this.video,
        "enviroment",
        this.canvas,
        this.snapSound
      );
      this.webcam
        .start()
        .then((result) => {
          console.log("webcam started", this.video.readyState);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    onPlay() {
      this.detectCanvas = faceapi.createCanvasFromMedia(this.video);
      this.$el.append(this.detectCanvas);
      this.displaySize = {
        width: this.video.width,
        height: this.video.height,
      };
      faceapi.matchDimensions(this.detectCanvas, this.displaySize);
      this.onDetectRender();
    },
    async onDetectRender() {
      const canvas = this.detectCanvas;
      const detections = await faceapi
        .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(
        detections,
        this.displaySize
      );
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      this.timer = window.requestAnimationFrame(this.onDetectRender);
    },
  },
};
</script>

<style scoped>
.container {
  position: relative;
  text-align: center;
}
.container video {
  position: relative;
  left: 0;
  top: 0;
}
.container ::v-deep canvas {
  position: absolute;
  left: 0;
  top: 0;
}
.d-none {
  display: none;
}
.btn-take-picture {
  margin-top: 10px;
}
.btn-detect-picture {
  margin-top: 10px;
  margin-left: 20px;
}
</style>
