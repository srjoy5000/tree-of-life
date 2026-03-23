import * as THREE from "three";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module";


// ===== CONFIG =====
const goldenRatio = (1 + Math.sqrt(5)) / 2 // 1.61803398875
const treeParams = {
  branch_angle: 45,
  tree_depth: 7,
  randomBranch: false, // delete later
  // randomize_tree: () => { createTree },
  // unrandomize_tree: () => { createTree },
  show_leaves: true,
  leaf_color: '#6bd9e1',
  num_branches: 3,
  scaling_factor: 1 / goldenRatio,
  root_dia_to_height: goldenRatio,
}
const branchParams = {
  branch_color: '#ffffff',
  wire_frame: false,
  num_segment: 3,
  dia_to_height: goldenRatio * 5 // golden ratio times five
}
const envParams = {
  show_stars: false,
  auto_rotation: true,
  show_axis: false,
  camera_dist: 20,
  env_light: '',
  background_color: '#000000',
  // background_color: '#F5F2EB',
  wave_height: 1,
  wave_dia: 1,
}

const clock = new THREE.Clock();
const HEIGHT = 2
const SEG = 3
const root_height = - HEIGHT / 2
const branchMat = new THREE.MeshBasicMaterial({ color: branchParams.branch_color, wireframe: branchParams.wire_frame });
const leafMat = new THREE.MeshBasicMaterial({ color: treeParams.leaf_color, wireframe: true });
const waveMat = new THREE.MeshBasicMaterial({ color: "white" })
const box_num = 50;
const box_size = 0.05
const waves = [];
const wavePos = [], waveRoffset = [], waveRotation = [];
// helper function for random range
let root_trunk;
const leaves = [];
let scene, camera, renderer, stats, controls;

// ===== init Items =====
function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}
function random_th() {

}
function createBranch(parentMesh, depth, currentDepth = 2) {
  // Set scale depending on the currentDepth
  let scale = Math.pow(treeParams.scaling_factor, currentDepth - 1) * 1.2
  let branchHeight = currentDepth > 2
    ? scale / treeParams.scaling_factor
    : 1;
  let num_branches = treeParams.num_branches;

  if (currentDepth > depth) {
    return;
  }

  for (let i = 1; i <= num_branches; i++) {
    if (!treeParams.randomBranch || Math.random() > 0.3) {
      let branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, HEIGHT * scale, SEG),
        branchMat
      );
      branch.name = `depth${currentDepth}_${i}`
      branch.position.z = (Math.sin(degToRad(treeParams.branch_angle)) * Math.cos(degToRad(360 / num_branches * i))) * scale
      branch.position.x = (Math.sin(degToRad(treeParams.branch_angle)) * Math.sin(degToRad(360 / num_branches * i))) * scale
      branch.position.y = branchHeight + (Math.cos(degToRad(treeParams.branch_angle)) * scale)
      branch.rotateY(degToRad(360 / num_branches * i)).rotateX(degToRad(treeParams.branch_angle))
      if (currentDepth === depth) {
        const leaf = new THREE.Mesh(
          new THREE.BoxGeometry(scale, scale, scale),
          leafMat
        )
        leaf.position.y = branchHeight * treeParams.scaling_factor
        leaf.name = `leaf_${i}`
        leaves.push(leaf);
        if (treeParams.show_leaves) branch.add(leaf);
      }
      parentMesh.add(branch);
      createBranch(branch, depth, currentDepth + 1);
    }
  }
}

function createTree() {
  if (root_trunk) {
    scene.remove(root_trunk);
    root_trunk.geometry.dispose();
    root_trunk.material.dispose();
  }
  const root_base = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, HEIGHT, SEG * 3),
    branchMat
  );
  root_trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, HEIGHT, SEG),
    branchMat
  );
  root_trunk.name = "root_trunk";
  root_trunk.position.y = root_height;
  root_base.position.y = root_height;
  createBranch(root_trunk, treeParams.tree_depth)
  console.log("root_trunk: ", root_trunk)
  scene.add(root_base)
  scene.add(root_trunk)
  return root_trunk;
}

function createWave() {
  for (let i = 0; i < box_num; i++) {
    const connectionMesh = new THREE.Mesh(
      new THREE.TorusGeometry(
        wavePos.sort()[i] / 10, box_size / 5,
        4, 72
      ),
      branchMat
    )
    // connectionMesh.position.y = root_height * 2 + Math.pow(i / 100, 1/i)
    // connectionMesh.position.y = root_height * 2 + (box_num - i) * (box_num - i) / 3000
    connectionMesh.position.y = root_height * 2 + wavePos.sort()[box_num - i] * wavePos.sort()[box_num - i] / 100
    connectionMesh.rotateX(degToRad(90));
    scene.add(connectionMesh)
  }
  for (let i = 0; i < box_num; i++) {
    // Create a torus
    const geometry = new THREE.TorusGeometry(
      wavePos[i], box_size / 10,
      4, 72
    )
    // Use EdgesGeometry for dashed wireframe
    const edges = new THREE.EdgesGeometry(geometry);
    const dashedMaterial = new THREE.LineDashedMaterial({
      color: "white",
      dashSize: 0.1,   // length of dash
      gapSize: 0.5,   // length of gap
    });

    const line = new THREE.LineSegments(edges, dashedMaterial);
    line.computeLineDistances(); // REQUIRED for dashed lines!
    line.position.y = root_height * 2;
    line.rotateX(degToRad(90));
    scene.add(line);
    waves.push(line);
  }
}

function addItems() {
  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  for (let i = 0; i < box_num; i++) {
    let waveX = randomRange(0, 7.5);
    wavePos.push(waveX);
    waveRoffset.push(degToRad(randomRange(0, 360)));
    waveRotation.push(degToRad(randomRange(-0.1, 0.1)))
  }
  // const axesHelper = new THREE.AxesHelper(2);
  // scene.add(axesHelper);
  root_trunk = createTree()
  createWave()
}

// ===== init GUI =====
function initGUI() {
  const gui = new GUI({ title: 'Controls (press "h" to toggle GUI)' });
  const treeFolder = gui.addFolder('Tree Setting')
  const branchFolder = gui.addFolder('Branch Setting')
  const envFolder = gui.addFolder('Environment Setting')
  treeFolder.add(treeParams, 'branch_angle', 0, 180).step(1).onFinishChange(createTree)
  treeFolder.add(treeParams, 'tree_depth', 2, 8).step(1).onFinishChange(createTree)
  treeFolder.add(treeParams, 'randomBranch').onChange(createTree)
  treeFolder.add(treeParams, 'show_leaves').onChange(createTree)
  treeFolder.addColor(treeParams, 'leaf_color').onChange((val) => {
    leaves.forEach(leaf => leaf.material.color.set(val));
  })
  treeFolder.add(treeParams, 'num_branches', 2, 6).step(1).onFinishChange(createTree)
  treeFolder.add(treeParams, 'scaling_factor', 0.1, 1).step(0.1).onFinishChange(createTree)
  treeFolder.add(treeParams, 'root_dia_to_height', 0.1, 1).step(0.1).onFinishChange(createTree)
  branchFolder.addColor(branchParams, 'branch_color').onChange(createTree)
  branchFolder.add(branchParams, 'wire_frame').onChange(createTree)
  branchFolder.add(branchParams, 'num_segment', 3, 6).step(1).onFinishChange(createTree)
  branchFolder.add(branchParams, 'dia_to_height', 0.1, 1).step(0.1).onFinishChange(createTree)
  envFolder.add(envParams, 'show_stars')
  // envFolder.add(envParams, 'auto_rotation')
  // envFolder.add(envParams, 'show_axis')
  envFolder.add(envParams, 'camera_dist')
  envFolder.add(envParams, 'env_light')
  envFolder.addColor(envParams, 'background_color').onChange((val) => {
    console.log("New Color:", val);
    scene.background.set(val);
  })
  envFolder.add(envParams, 'wave_height', 0, 1).step(0.1)
  envFolder.add(envParams, 'wave_dia', 0, 10).step(1)

  // initialize FPS window
  stats = new Stats()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)

  // toggle GUI and FPS window with h key
  window.addEventListener('keydown', function (event) {
    if (event.key === 'h') {
      gui.show(gui._hidden);
      if (document.body.contains(stats.dom)) {
        document.body.removeChild(stats.dom);
      } else {
        document.body.appendChild(stats.dom)
      }
    }
    if (event.key === 'r') {
      controls.autoRotate = !controls.autoRotate
    }
  });

}

// ===== init =====
function init() {
  // initialize the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(envParams.background_color);
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.z = 20;

  const canvas = document.querySelector("canvas.threejs");
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // instantiate the controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.autoRotate = envParams.auto_rotation;
  initGUI();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  });

  addItems();
  // console.log(wavePos.waveX);
}


// ===== Render scene =====
function renderloop() {
  window.requestAnimationFrame(renderloop);
  const elapsedTime = clock.getElapsedTime();
  stats.begin();
  controls.update();
  if (waves.length > 0) {
    waves.forEach((wave, i) => {
      let height = Math.sin(waveRoffset[i] + elapsedTime / 2) / 5 + (root_height * 2);
      wave.position.y = height
      wave.rotation.z += waveRotation[i];
    })
  }
  renderer.render(scene, camera);
  stats.end();
};


init();
renderloop();
