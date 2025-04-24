/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 *
 * This example demonstrates hand tracking on live video through ml5.handPose.
 */

let handPose;
let video;
let hands = [];
let lines1 = ["Hello from", "Nimblebot!"];
let lines2 = ["Are you a senior", "graphic designer", "looking for a challenge?"];
let lines3 = ["Are you", "passionate about", "branding and comms?"];
let lines4 = ["We want you!"];
const n = 1.4;

function preload() {
  // Load the handPose model
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(780*n, 580*n);
  pixelDensity(2);
  // Create the webcam video and hide it
  video = createCapture(VIDEO, { flipped: true });
  video.size(780*n, 580*n);
  video.hide();
  // start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);
  textAlign(CENTER, CENTER);
}

function draw() {
  // Draw the webcam video

  image(video, 0, 0, width, height);
  
  //filter(GRAY);
  // Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      let thumb = hand.thumb_tip;
      let index = hand.index_finger_tip;

      if (hand.handedness == "Left") {

        let d = dist(thumb.x, thumb.y, index.x, index.y);
        if (d > 40) {
          let txtSize = map(d, 40, 150, 16, 64);

          let angle = atan2(index.y - thumb.y, index.x - thumb.x);
          let midX = (thumb.x + index.x) / 2;
          let midY = (thumb.y + index.y) / 2;

          push();
          translate(midX, midY);         
          rotate(angle-PI);
          textSize(txtSize/n);
          translate(0,-txtSize/n);
          for (let i = 0; i < lines3.length; i++) {
            text(lines3[i], 0, i * txtSize/1.6); // 20 — расстояние между строками, можно менять
          }
          pop();
          fill(255, 255, 255);
        }
      } else {
        let d = dist(thumb.x, thumb.y, index.x, index.y);
        if (d > 50) {
          let txtSize = map(d, 50, 150, 16, 74);

          let angle = atan2(index.y - thumb.y, index.x - thumb.x);
          let midX = (thumb.x + index.x) / 2;
          let midY = (thumb.y + index.y) / 2;

          push();
          translate(midX, midY);
          rotate(angle);
          textSize(txtSize/n);
          translate(0,-txtSize/n);
          for (let i = 0; i < lines3.length; i++) {
            text(lines3[i], 0, i * txtSize/1.6); // 20 — расстояние между строками, можно менять
          }
          pop();
          fill(255, 255, 255);
        }
      }
    }
  }
  fill(0);
  rect(0, 0, 223, 810);
  rect(865,0, 223, 810);
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}
