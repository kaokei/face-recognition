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
    <a-button type="primary" @click="takePicture">拍照</a-button>
  </div>
</template>

<script>
import * as faceapi from "face-api.js";
import Webcam from "webcam-easy";

export default {
  name: "WebCam",
  props: {
    msg: String,
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
    startVideo() {
      this.webcam = new Webcam(this.video, "enviroment", this.canvas, this.snapSound);
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
      // canvas.getContext('2d').scale(-1, 1);
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
        // detections.map((detection) => {
        //   console.log(detection.expressions);
        //   if (detection.expressions.sad > 0.5) {
        //     message.innerHTML = "I Love you so much";
        //     x.src =
        //       "https://www.creativefabrica.com/wp-content/uploads/2019/01/Dont-be-Sad-with-Illustration-by-si.jalembe.jpg";
        //   } else if (detection.expressions.happy > 0.5) {
        //     message.innerHTML = "I like to see you happy";
        //     x.src =
        //       "https://pastorleebrewer.files.wordpress.com/2015/09/jesus-wink-and-point.png?w=298&h=300";
        //   } else if (detection.expressions.surprised > 0.5) {
        //     message.innerHTML = "don't catch a heart attack";
        //     x.src =
        //       "data:image/jpeg;base64,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";
        //   } else if (detection.expressions.disgusted > 0.5) {
        //     message.innerHTML = "don't be disgusted it's your face";
        //     x.src =
        //       "https://st.depositphotos.com/2602289/4107/i/950/depositphotos_41077503-stock-photo-disgusted-man-pointing.jpg";
        //   } else if (detection.expressions.fearful > 0.5) {
        //     message.innerHTML = "don't be scare homie";
        //     x.src =
        //       "https://pyxis.nymag.com/v1/imgs/0c2/a83/4cfc644e76854d6cfe92f58219d2273a25-14-courage-the-cowardly-dog.2x.rsocial.w600.jpg";
        //   } else if (detection.expressions.angry > 0.5) {
        //     message.innerHTML = "relax please";
        //     x.src =
        //       "https://cdn.vox-cdn.com/thumbor/vjduTPE3tf58oi-GvZiwLJNMniE=/0x0:2048x1080/1200x800/filters:focal(1169x318:1495x644)/cdn.vox-cdn.com/uploads/chorus_image/image/63677017/DNR1520_v011_078137.1142.6.jpg";
        //   } else {
        //     message.innerHTML = "You are Chillin'";
        //     x.src =
        //       "data:image/jpeg;base64,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";
        //   }
        // });
      }, 100);
    },
  },
};
</script>

<style scoped>
.container {
  position: relative;
}
.container video {
  position: absolute;
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
</style>
