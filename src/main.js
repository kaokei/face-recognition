import Vue from "vue";
import App from "./App.vue";
import store from "./store";

Vue.config.productionTip = false;

import {
  Button,
  Row,
  Col,
  Upload,
  Icon,
  Modal,
  List,
  Card
} from "ant-design-vue";

[Button, Row, Col, Upload, Icon, Modal, List, Card].forEach(item =>
  Vue.use(item)
);

new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
