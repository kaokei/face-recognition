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
      canvas: null,
      snapSound: null,
      timer: null,
      webcam: null,
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
    this.timer && clearInterval(this.timer);
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
            console.log(
              "bestMatch.toString() ",
              bestMatch.toString(),
              bestMatch,
              imageObj
            );
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
      console.log("onPlay :>> ");
      const canvas = faceapi.createCanvasFromMedia(this.video);
      this.$el.append(canvas);
      const displaySize = {
        width: this.video.width,
        height: this.video.height,
      };
      faceapi.matchDimensions(canvas, displaySize);
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }, 2000);
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
