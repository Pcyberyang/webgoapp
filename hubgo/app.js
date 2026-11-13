import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const DATA = window.SCENE_TERRAIN_DATA || window.DAFUSHAN_DATA;
const CITY_DATA = window.SCENE_CITY || window.GANGGONG_CITY;
const RIDE_ROUTE = window.RIDE_ROUTE;
const STYLE_PRESETS = {
  natural: {
    label: "暖白沙盘",
    background: "#f1efe8",
    low: "#82966f",
    middle: "#a6ad8d",
    high: "#c9c4b0",
    rock: "#7c7e73",
    forest: "#5f7558",
    submerged: "#355a6c",
    base: "#a49a84",
    perimeter: "#596852",
    water: "#3e7188",
    waterOutline: "#c3dce6",
    contour: "#495b45",
    filter: "none",
  },
  forest: {
    label: "晨雾森林",
    background: "#fbfaf3",
    low: "#78a878",
    middle: "#9bc286",
    high: "#d4d4a7",
    rock: "#b49a75",
    forest: "#477f5c",
    submerged: "#4f8490",
    base: "#a89172",
    perimeter: "#416b50",
    water: "#60a2ac",
    waterOutline: "#d5eee8",
    contour: "#41694e",
    filter: "saturate(1.08) contrast(1.035) brightness(1.01)",
  },
  map: {
    label: "地图纸绿",
    background: "#fbf7eb",
    low: "#91a76e",
    middle: "#b5bd84",
    high: "#dfd09b",
    rock: "#c4a274",
    forest: "#66865b",
    submerged: "#698e94",
    base: "#b2946e",
    perimeter: "#65784e",
    water: "#73a6ac",
    waterOutline: "#e2ece2",
    contour: "#647147",
    filter: "saturate(1.04) contrast(1.035) brightness(1.015)",
  },
  meadow: {
    label: "明净草坡",
    background: "#fcf9ef",
    low: "#83b76b",
    middle: "#abc97d",
    high: "#e0d49c",
    rock: "#c29a70",
    forest: "#5a9259",
    submerged: "#4f8b92",
    base: "#b5946b",
    perimeter: "#54754b",
    water: "#62a5ac",
    waterOutline: "#d8eee8",
    contour: "#546c43",
    filter: "saturate(1.12) contrast(1.04) brightness(1.015)",
  },
  autumn: {
    label: "暖砂秋山",
    background: "#fbf6ea",
    low: "#9ca466",
    middle: "#c1b277",
    high: "#e3c891",
    rock: "#bf895f",
    forest: "#6f8e54",
    submerged: "#58878f",
    base: "#b37e58",
    perimeter: "#6d7047",
    water: "#63949d",
    waterOutline: "#e6e6d4",
    contour: "#6b6740",
    filter: "saturate(1.06) contrast(1.04) brightness(1.015)",
  },
  pine: {
    label: "松林青",
    background: "#f7f8ef",
    low: "#6d9c7a",
    middle: "#8eb58e",
    high: "#c3cda7",
    rock: "#a58f75",
    forest: "#3f7c62",
    submerged: "#467e88",
    base: "#9f8a70",
    perimeter: "#3f6653",
    water: "#4f8f9e",
    waterOutline: "#cfe8e3",
    contour: "#3b5f4a",
    filter: "saturate(1.08) contrast(1.035) brightness(1.01)",
  },
  wild: {
    label: "旷野冒险风",
    background: "#d9eef2",
    skyTop: "#a9d9ec",
    skyBottom: "#f7efce",
    clouds: true,
    low: "#63b65a",
    middle: "#99ce68",
    high: "#ead787",
    rock: "#c88d59",
    forest: "#3d9253",
    submerged: "#348aa2",
    base: "#aa754e",
    perimeter: "#31634c",
    water: "#43b3c7",
    waterOutline: "#e2fff7",
    contour: "#2f6348",
    filter: "saturate(1.12) contrast(1.055) brightness(1.025)",
    toon: true,
    hemisphere: 1.02,
    sun: 1.62,
    exposure: 1.0,
    waterOpacity: 0.86,
    waterRoughness: 0.2,
  },
  artistic: {
    label: "卡通幻想沙盘",
    background: "#f1efe8",
    low: "#82966f",
    middle: "#a6ad8d",
    high: "#c9c4b0",
    rock: "#7c7e73",
    forest: "#5f7558",
    submerged: "#355a6c",
    base: "#a49a84",
    perimeter: "#596852",
    water: "#3e7188",
    waterOutline: "#c3dce6",
    contour: "#495b45",
    filter: "none",
    toon: false,
    cartoonBuildings: true,
    hemisphere: 2.2,
    sun: 3.25,
    exposure: 1.02,
    waterOpacity: 0.88,
    waterRoughness: 0.28,
    artistic: true,
  },
};
const activeStyle = STYLE_PRESETS.artistic;

const canvas = document.getElementById("terrain-canvas");
const loadingScreen = document.getElementById("loading-screen");
const errorScreen = document.getElementById("error-screen");
const statusMessage = document.getElementById("status-message");
const exaggerationInput = document.getElementById("exaggeration");
const exaggerationValue = document.getElementById("exaggeration-value");
const showWaterInput = document.getElementById("show-water");
const showContoursInput = document.getElementById("show-contours");
const showBuildingsInput = document.getElementById("show-buildings");
const showRoadsInput = document.getElementById("show-roads");
const autoRotateInput = document.getElementById("auto-rotate");
const terrainOpacityInput = document.getElementById("terrain-opacity");
const terrainOpacityValue = document.getElementById("terrain-opacity-value");
const cityOpacityInput = document.getElementById("city-opacity");
const cityOpacityValue = document.getElementById("city-opacity-value");
const viewHint = document.getElementById("view-hint");
const peakLabel = document.getElementById("peak-label");
const locationLabel = document.getElementById("location-label");

if (!DATA || !DATA.metadata || !DATA.grid) {
  fail("地形数据缺失或格式不正确。");
  throw new Error("SCENE_TERRAIN_DATA is unavailable");
}

const metadata = DATA.metadata;
const gridSize = metadata.gridSize;
const heights = Float32Array.from(DATA.grid.heights);
const vegetation = Uint8Array.from(DATA.grid.vegetation);
const waterLabels = Uint8Array.from(DATA.grid.waterLabels);
const minElevation = metadata.minElevation;
const maxElevation = metadata.maxElevation;
const width = metadata.widthMeters;
const depth = metadata.depthMeters;
const heightSpan = Math.max(1, maxElevation - minElevation);
const baseDepth = 24;
const OSM_TILE_SIZE = 256;
const OSM_TILE_URL = "https://tile.openstreetmap.de";
const initialExaggeration = Number(exaggerationInput.value);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
let scene;
let camera;
let controls;
let terrainGroup;
let terrainMesh;
let waterGroup;
let contourLines;
let cityGroup;
let cityBuildings;
let cityRoads;
let rideGroup = null;
let rideBounds = null;
let rideMeanY = null;
let rideXs = null;
let rideZs = null;
let rideRawYs = null;
let rideCoreMesh = null;
let rideGlowMesh = null;
let rideStartMarker = null;
let rideEndMarker = null;
let ridePulse = null;
let rideCurve = null;
let rideGroundYs = null;
let rideProjectionGroup = null;
let rideProjectionCoreMesh = null;
let rideProjectionGlowMesh = null;
let rideProjectionPulse = null;
let rideProjectionTether = null;
let rideHeightCurtain = null;
let rideMapProjectionGroup = null;
let rideMapProjectionPulse = null;
let rideProgress = 0;
let rideAuto = true;
let rideResumeTimer = null;
let ridePulseActive = false;
let ridePulseScale = 1;
let pulseActiveTimer = null;
let routeSliderPointerActive = false;
let lastRideTime = 0;
let routeSlider = null;
let routeSliderValue = null;
let compassDial = null;
let baseMapMesh = null;
let baseMapToggle = null;
let baseMapProviderSelect = null;
let baseMapTexture = null;
let baseMapLocalTexture = null;
let baseMapOnlineTexture = null;
let baseMapOnlineAttempted = false;
let baseMapOnlineLoadPromise = null;
let baseMapLoadToken = 0;
const cityMaterials = [];
let groundPlane;
let peakMarker;
let peakPosition;
let locationMarker = null;
let locationPosition = null;
let didInteract = false;
let toastTimer = null;
let terrainSkirt = null;
const terrainMaterials = [];

document.getElementById("triangle-count").textContent =
  `${(metadata.triangleCount / 1000).toFixed(1)}k`;

try {
  initScene();
  createCompassHud();
  buildTerrain();
  buildWater();
  if (CITY_DATA) buildCityLayer();
  buildContours();
  buildRideRoute();
  buildMarkers();
  bindUI();
  resetView(false);
  renderer.setAnimationLoop(render);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loadingScreen.classList.add("is-complete");
    });
  });
} catch (error) {
  console.error(error);
  fail("三维地形初始化失败。");
}

function fail(message) {
  if (loadingScreen) loadingScreen.classList.add("is-complete");
  const errorDetail = errorScreen?.querySelector(".error-detail");
  if (errorDetail && message) errorDetail.textContent = message;
  if (errorScreen) errorScreen.hidden = false;
}

function createSkyTexture(style) {
  const sky = document.createElement("canvas");
  sky.width = 1024;
  sky.height = 640;
  const context = sky.getContext("2d");
  if (!context) return new THREE.Color(style.background);

  const gradient = context.createLinearGradient(0, 0, 0, sky.height);
  gradient.addColorStop(0, style.skyTop);
  gradient.addColorStop(0.66, style.background);
  gradient.addColorStop(1, style.skyBottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, sky.width, sky.height);

  if (style.clouds) {
    context.save();
    context.filter = "blur(18px)";
    context.fillStyle = "rgba(255, 253, 243, 0.38)";
    for (const [x, y, rx, ry] of [
      [130, 148, 160, 24],
      [278, 112, 112, 18],
      [730, 172, 180, 24],
      [892, 142, 102, 17],
      [520, 256, 205, 18],
    ]) {
      context.beginPath();
      context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  const texture = new THREE.CanvasTexture(sky);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createToonGradient() {
  const values = new Uint8Array([72, 138, 205, 255]);
  const texture = new THREE.DataTexture(
    values,
    values.length,
    1,
    THREE.RedFormat,
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function initScene() {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = activeStyle.toon
    ? THREE.NeutralToneMapping
    : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = activeStyle.exposure ?? 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(activeStyle.background);

  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    20,
    18000,
  );
  camera.position.set(width * 0.95, 1850, depth * 1.2);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.78;
  controls.panSpeed = 0.6;
  controls.minDistance = 1750;
  controls.maxDistance = 8800;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI * 0.475;
  controls.autoRotateSpeed = 0.36;
  controls.target.set(0, 160, 0);

  const hemisphere = new THREE.HemisphereLight(
    "#fff8eb",
    "#6c7964",
    activeStyle.hemisphere ?? 2.2,
  );
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(
    "#fff0d7",
    activeStyle.sun ?? 3.25,
  );
  sun.position.set(-2800, 4700, 2100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 300;
  sun.shadow.camera.far = 11000;
  sun.shadow.camera.left = -4200;
  sun.shadow.camera.right = 4200;
  sun.shadow.camera.top = 4200;
  sun.shadow.camera.bottom = -4200;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 4;
  scene.add(sun);
  scene.add(sun.target);

  const fill = new THREE.DirectionalLight("#dce8dc", 0.65);
  fill.position.set(3100, 2100, -1900);
  scene.add(fill);

  groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(9500, 9500),
    new THREE.ShadowMaterial({
      color: "#243025",
      opacity: 0.12,
      transparent: true,
      depthWrite: false,
    }),
  );
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = -90;
  groundPlane.receiveShadow = true;
  groundPlane.renderOrder = -2;
  scene.add(groundPlane);

  const softShadow = createSoftShadow();
  if (softShadow) scene.add(softShadow);
  createBaseMapLayer();

  window.addEventListener("resize", resize, { passive: true });
  canvas.addEventListener("pointerdown", hideHint, { once: true });
}

function buildTerrain() {
  terrainGroup = new THREE.Group();
  terrainGroup.name = "Ganggong Park terrain";
  scene.add(terrainGroup);

  const positions = new Float32Array(gridSize * gridSize * 3);
  const colors = new Float32Array(gridSize * gridSize * 3);
  const indices = [];
  const dx = width / (gridSize - 1);
  const dz = depth / (gridSize - 1);
  const palette = {
    low: new THREE.Color(activeStyle.low),
    middle: new THREE.Color(activeStyle.middle),
    high: new THREE.Color(activeStyle.high),
    rock: new THREE.Color(activeStyle.rock),
    forest: new THREE.Color(activeStyle.forest),
    submerged: new THREE.Color(activeStyle.submerged),
  };
  const scratch = new THREE.Color();
  const forestColor = new THREE.Color();
  const rockColor = new THREE.Color();

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const gridIndex = row * gridSize + col;
      const vertexIndex = gridIndex * 3;
      const elevation = heights[gridIndex];
      const x = -width / 2 + col * dx;
      const z = -depth / 2 + row * dz;
      positions[vertexIndex] = x;
      positions[vertexIndex + 1] = elevation - minElevation;
      positions[vertexIndex + 2] = z;

      const left = heights[row * gridSize + Math.max(0, col - 1)];
      const right = heights[row * gridSize + Math.min(gridSize - 1, col + 1)];
      const north = heights[Math.max(0, row - 1) * gridSize + col];
      const south = heights[Math.min(gridSize - 1, row + 1) * gridSize + col];
      const gradientX = (right - left) / (2 * dx);
      const gradientZ = (south - north) / (2 * dz);
      const slope = Math.hypot(gradientX, gradientZ);
      const normalizedHeight = THREE.MathUtils.clamp(
        (elevation - minElevation) / heightSpan,
        0,
        1,
      );
      const vegetationAmount = vegetation[gridIndex] / 255;
      const waterAmount = waterLabels[gridIndex] > 0 ? 1 : 0;

      if (normalizedHeight < 0.54) {
        scratch.copy(palette.low).lerp(palette.middle, normalizedHeight / 0.54);
      } else {
        scratch
          .copy(palette.middle)
          .lerp(palette.high, (normalizedHeight - 0.54) / 0.46);
      }
      forestColor.copy(palette.forest);
      scratch.lerp(forestColor, vegetationAmount * 0.38);
      rockColor.copy(palette.rock);
      scratch.lerp(rockColor, THREE.MathUtils.smoothstep(slope, 0.2, 0.9) * 0.34);
      if (waterAmount) scratch.lerp(palette.submerged, 0.78);

      const paperNoise =
        Math.sin(x * 0.012 + z * 0.007) * 0.008 +
        Math.sin(x * 0.031 - z * 0.019) * 0.004;
      const grain = 1 + paperNoise;
      colors[vertexIndex] = scratch.r * grain;
      colors[vertexIndex + 1] = scratch.g * grain;
      colors[vertexIndex + 2] = scratch.b * grain;

      if (row < gridSize - 1 && col < gridSize - 1) {
        const a = row * gridSize + col;
        const b = a + 1;
        const c = a + gridSize;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = activeStyle.toon
    ? new THREE.MeshToonMaterial({
        vertexColors: true,
        gradientMap: createToonGradient(),
        side: THREE.DoubleSide,
      })
    : new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        metalness: 0,
        side: THREE.DoubleSide,
        flatShading: false,
      });
  terrainMaterials.push(material);
  terrainMesh = new THREE.Mesh(geometry, material);
  terrainMesh.name = "Terrain surface";
  terrainMesh.castShadow = true;
  terrainMesh.receiveShadow = true;
  terrainGroup.add(terrainMesh);

  terrainSkirt = createTerrainSkirt(dx, dz);
  terrainSkirt.castShadow = true;
  terrainSkirt.receiveShadow = true;
  terrainMaterials.push(terrainSkirt.material);
  terrainGroup.add(terrainSkirt);

  const perimeter = createPerimeterLine();
  terrainGroup.add(perimeter);
  terrainGroup.scale.y = initialExaggeration;
}

function createTerrainSkirt(dx, dz) {
  const positions = [];
  const indices = [];
  let vertexCount = 0;
  const bottom = -baseDepth;

  const boundary = [];
  for (let col = 0; col < gridSize; col += 1) boundary.push([0, col]);
  for (let row = 1; row < gridSize; row += 1) boundary.push([row, gridSize - 1]);
  for (let col = gridSize - 2; col >= 0; col -= 1) boundary.push([gridSize - 1, col]);
  for (let row = gridSize - 2; row > 0; row -= 1) boundary.push([row, 0]);

  for (let index = 0; index < boundary.length; index += 1) {
    const [row, col] = boundary[index];
    const x = -width / 2 + col * dx;
    const z = -depth / 2 + row * dz;
    const y = heights[row * gridSize + col] - minElevation;
    positions.push(x, y, z, x, bottom, z);
    vertexCount += 2;
  }

  for (let index = 0; index < boundary.length - 1; index += 1) {
    const topA = index * 2;
    const bottomA = topA + 1;
    const topB = topA + 2;
    const bottomB = topA + 3;
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: activeStyle.base,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
}

function createPerimeterLine() {
  const points = [];
  const dx = width / (gridSize - 1);
  const dz = depth / (gridSize - 1);
  const boundary = [];
  for (let col = 0; col < gridSize; col += 1) boundary.push([0, col]);
  for (let row = 1; row < gridSize; row += 1) boundary.push([row, gridSize - 1]);
  for (let col = gridSize - 2; col >= 0; col -= 1) boundary.push([gridSize - 1, col]);
  for (let row = gridSize - 2; row > 0; row -= 1) boundary.push([row, 0]);

  for (const [row, col] of boundary) {
    points.push(
      new THREE.Vector3(
        -width / 2 + col * dx,
        heights[row * gridSize + col] - minElevation + 0.7,
        -depth / 2 + row * dz,
      ),
    );
  }
  points.push(points[0].clone());

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: activeStyle.perimeter,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
  );
}

function buildWater() {
  const geometries = [];
  const outlinePositions = [];

  for (const body of DATA.waterBodies) {
    if (!body.outer || body.outer.length < 3) continue;
    const shape = new THREE.Shape();
    body.outer.forEach(([x, z], index) => {
      if (index === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();

    for (const hole of body.holes || []) {
      if (hole.length < 3) continue;
      const path = new THREE.Path();
      hole.forEach(([x, z], index) => {
        if (index === 0) path.moveTo(x, -z);
        else path.lineTo(x, -z);
      });
      path.closePath();
      shape.holes.push(path);
    }

    let geometry;
    try {
      geometry = new THREE.ShapeGeometry(shape);
    } catch {
      continue;
    }
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, body.level - minElevation + 0.65, 0);
    geometries.push(geometry);

    for (let index = 0; index < body.outer.length; index += 1) {
      const current = body.outer[index];
      const next = body.outer[(index + 1) % body.outer.length];
      outlinePositions.push(
        current[0],
        body.level - minElevation + 1.1,
        current[1],
        next[0],
        body.level - minElevation + 1.1,
        next[1],
      );
    }
  }

  waterGroup = new THREE.Group();
  waterGroup.name = "Water surfaces";
  if (geometries.length) {
    const merged = mergeGeometries(geometries, false);
    if (merged) {
      merged.computeVertexNormals();
      const water = new THREE.Mesh(
        merged,
        new THREE.MeshPhysicalMaterial({
          color: activeStyle.water,
          roughness: activeStyle.waterRoughness ?? 0.28,
          metalness: 0,
          clearcoat: 0.18,
          clearcoatRoughness: 0.42,
          transparent: true,
          opacity: activeStyle.waterOpacity ?? 0.88,
          side: THREE.DoubleSide,
          depthWrite: true,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
      );
      water.name = "Ganggong Park water";
      water.receiveShadow = true;
      water.renderOrder = 2;
      waterGroup.add(water);
    } else {
      for (const geometry of geometries) {
        const water = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color: activeStyle.water,
            roughness: activeStyle.waterRoughness ?? 0.3,
            transparent: true,
            opacity: activeStyle.waterOpacity ?? 0.88,
            side: THREE.DoubleSide,
          }),
        );
        water.receiveShadow = true;
        waterGroup.add(water);
      }
    }
  }

  if (outlinePositions.length) {
    const outlineGeometry = new THREE.BufferGeometry();
    outlineGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(outlinePositions, 3),
    );
    const outlines = new THREE.LineSegments(
      outlineGeometry,
      new THREE.LineBasicMaterial({
        color: activeStyle.waterOutline,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    outlines.renderOrder = 3;
    waterGroup.add(outlines);
  }

  waterGroup.visible = showWaterInput.checked;
  terrainGroup.add(waterGroup);
}

function buildCityLayer() {
  const data = CITY_DATA;
  if (!data?.buildings?.length || !data?.roads?.length) return;

  cityGroup = new THREE.Group();
  cityGroup.name = "Simplified city layer";

  const buildingPalette = [
    new THREE.Color("#c7b695"),
    new THREE.Color("#81958b"),
    new THREE.Color("#b79a76"),
    new THREE.Color("#929986"),
  ];
  const positions = [];
  const colors = [];
  const topColor = new THREE.Color();
  const sideColor = new THREE.Color();

  const addPrism = (
    polygon,
    bottom,
    top,
    roofColor,
    wallColor,
    capRoof = true,
  ) => {
    const faces = THREE.ShapeUtils.triangulateShape(polygon, []);
    if (capRoof) {
      for (const face of faces) {
        for (const pointIndex of face) {
          const point = polygon[pointIndex];
          positions.push(point.x, top, point.y);
          colors.push(roofColor.r, roofColor.g, roofColor.b);
        }
      }
    }

    for (let index = 0; index < polygon.length; index += 1) {
      const a = polygon[index];
      const b = polygon[(index + 1) % polygon.length];
      positions.push(
        a.x, top, a.y,
        a.x, bottom, a.y,
        b.x, top, b.y,
        b.x, top, b.y,
        a.x, bottom, a.y,
        b.x, bottom, b.y,
      );
      const edgeShade = 0.88 + (index % 3) * 0.045;
      for (let vertex = 0; vertex < 6; vertex += 1) {
        colors.push(
          wallColor.r * edgeShade,
          wallColor.g * edgeShade,
          wallColor.b * edgeShade,
        );
      }
    }
  };

  for (const building of data.buildings) {
    if (!building.p || building.p.length < 3) continue;
    const points = building.p.map(([x, z]) => new THREE.Vector2(x, z));
    let signedArea = 0;
    for (let index = 0; index < points.length; index += 1) {
      const next = (index + 1) % points.length;
      signedArea +=
        points[index].x * points[next].y - points[next].x * points[index].y;
    }
    if (signedArea < 0) points.reverse();

    const center = points.reduce(
      (sum, point) => sum.add(point),
      new THREE.Vector2(),
    ).multiplyScalar(1 / points.length);
    const ground =
      elevationAt(center.x, center.y) - minElevation + 0.7;
    const buildingHeight = Math.max(3, building.h || 8) * 0.62;
    const top = ground + buildingHeight;
    const base = ground - 1.8;
    const paletteIndex = THREE.MathUtils.clamp(
      building.k ?? 0,
      0,
      buildingPalette.length - 1,
    );
    topColor.copy(buildingPalette[paletteIndex]).lerp(
      new THREE.Color("#fff2d4"),
      0.12,
    );
    sideColor.copy(buildingPalette[paletteIndex]).multiplyScalar(0.84);

    if ((building.l ?? 1) >= 2 && buildingHeight > 12) {
      const podiumTop = ground + buildingHeight * 0.28;
      const upperPoints = points.map(
        (point) =>
          new THREE.Vector2(
            center.x + (point.x - center.x) * 0.72,
            center.y + (point.y - center.y) * 0.72,
          ),
      );
      addPrism(points, base, podiumTop, topColor, sideColor);
      addPrism(
        upperPoints,
        podiumTop + 0.3,
        top,
        topColor,
        sideColor,
      );
    } else {
      addPrism(points, base, top, topColor, sideColor);
    }
  }

  const buildingGeometry = new THREE.BufferGeometry();
  buildingGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  buildingGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3),
  );
  buildingGeometry.computeVertexNormals();
  buildingGeometry.computeBoundingSphere();

  const buildingMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  cityMaterials.push(buildingMaterial);
  cityBuildings = new THREE.Mesh(buildingGeometry, buildingMaterial);
  cityBuildings.name = "Simplified buildings";
  cityBuildings.castShadow = true;
  cityBuildings.receiveShadow = true;
  cityBuildings.renderOrder = 4;
  cityGroup.add(cityBuildings);

  const roadPositions = [];
  const roadColors = [];
  const roadPalette = {
    motorway: new THREE.Color("#65715f"),
    trunk: new THREE.Color("#65715f"),
    primary: new THREE.Color("#788171"),
    secondary: new THREE.Color("#8f9381"),
    tertiary: new THREE.Color("#a6a18d"),
    tertiary_construction: new THREE.Color("#a6a18d"),
    minor: new THREE.Color("#b8af98"),
    minor_construction: new THREE.Color("#b8af98"),
    service: new THREE.Color("#c9bfa8"),
    living_street: new THREE.Color("#bdb39c"),
  };

  for (const road of data.roads) {
    if (!road.p || road.p.length < 2) continue;
    const color = roadPalette[road.c] ?? roadPalette.minor;
    const halfWidth = Math.max(1.5, (road.w || 6) * 0.5);
    for (let index = 0; index < road.p.length - 1; index += 1) {
      const [ax, azRaw] = road.p[index];
      const [bx, bzRaw] = road.p[index + 1];
      const az = azRaw;
      const bz = bzRaw;
      const dx = bx - ax;
      const dz = bz - az;
      const length = Math.hypot(dx, dz);
      if (length < 1) continue;
      const nx = (-dz / length) * halfWidth;
      const nz = (dx / length) * halfWidth;
      const ay =
        elevationAt(ax, az) - minElevation + 0.65;
      const by =
        elevationAt(bx, bz) - minElevation + 0.65;
      roadPositions.push(
        ax + nx, ay, az + nz,
        ax - nx, ay, az - nz,
        bx + nx, by, bz + nz,
        bx + nx, by, bz + nz,
        ax - nx, ay, az - nz,
        bx - nx, by, bz - nz,
      );
      for (let vertex = 0; vertex < 6; vertex += 1) {
        roadColors.push(color.r, color.g, color.b);
      }
    }
  }

  const roadGeometry = new THREE.BufferGeometry();
  roadGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(roadPositions, 3),
  );
  roadGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(roadColors, 3),
  );
  roadGeometry.computeVertexNormals();
  roadGeometry.computeBoundingSphere();
  const roadMaterial = activeStyle.toon
    ? new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    : new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.96,
        metalness: 0,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
  cityMaterials.push(roadMaterial);
  cityRoads = new THREE.Mesh(roadGeometry, roadMaterial);
  cityRoads.name = "Simplified roads";
  cityRoads.receiveShadow = true;
  cityRoads.renderOrder = 3;
  cityGroup.add(cityRoads);

  terrainGroup.add(cityGroup);
  cityGroup.visible = true;
  const cityTriangles = (positions.length + roadPositions.length) / 9;
  document.getElementById("triangle-count").textContent =
    `${((metadata.triangleCount + cityTriangles) / 1000).toFixed(1)}k`;
  const scene = data.metadata.scene;
  document.getElementById("city-type").textContent = scene
    ? `${scene.primary.label}${scene.primary.mixed ? " · 混合" : ""}`
    : data.metadata.settlementLabel;
  if (scene) {
    const plan = data.metadata.buildingPlan;
    document.getElementById("city-modifiers").textContent = [
      scene.modifiers.terrain.label,
      scene.modifiers.water.label,
      scene.modifiers.green.label,
      plan?.modeLabel,
      plan?.landmarkCount ? `重点${plan.landmarkCount}栋` : null,
      metadata.terrainPlan
        ? `地形${metadata.terrainPlan.gridSize}²`
        : null,
      metadata.areaPlan?.label,
    ].filter(Boolean).join(" · ");
  }
  document.getElementById("city-building-count").textContent =
    data.metadata.totalBuildings.toLocaleString("zh-CN");
  document.getElementById("region-area").textContent =
    data.metadata.artisticMode
      ? "艺术演绎"
      : `${Number(metadata.areaKm2 ?? 0).toFixed(1)} km²`;
  const plan = data.metadata.buildingPlan;
  if (data.metadata.artisticMode) {
    const primaryType = data.metadata.primaryType;
    document.getElementById("city-type").textContent =
      data.metadata.artisticLabel ?? "幻想城市";
    document.getElementById("city-modifiers").textContent =
      primaryType === "scenic" || primaryType === "park"
        ? `层叠地形 · 山水形态 · 抽象地标${plan?.landmarkCount ?? 0}座`
        : `程序化街区 · ${data.metadata.densitySummary?.label ?? "混合密度"} · ` +
          `抽象地标${plan?.landmarkCount ?? 0}座`;
    statusMessage.textContent =
      `${data.metadata.artisticLabel ?? "幻想城市"} · ` +
      `${data.metadata.totalBuildings} 栋艺术建筑`;
  } else {
    statusMessage.textContent =
      `${scene?.primary.label ?? data.metadata.settlementLabel} · ` +
      `${plan?.modeLabel ?? "建筑层"} · ${data.metadata.totalBuildings} 栋`;
  }
}

function applyCityOpacity(percent) {
  const value = THREE.MathUtils.clamp(percent / 100, 0, 1);
  for (const material of cityMaterials) {
    material.transparent = value < 0.999;
    material.opacity = value;
    material.depthWrite = value >= 0.999;
    material.needsUpdate = true;
  }
  if (cityOpacityInput) {
    cityOpacityInput.dataset.cityOpacity = value.toFixed(2);
  }
}

function applyTerrainOpacity(percent) {
  const value = THREE.MathUtils.clamp(percent / 100, 0, 1);
  for (const material of terrainMaterials) {
    material.transparent = value < 0.999;
    material.opacity = value;
    material.depthWrite = value >= 0.999;
    material.needsUpdate = true;
  }
  if (terrainMesh) {
    terrainMesh.visible = value > 0.001;
    terrainMesh.castShadow = value >= 0.85;
  }
  if (terrainSkirt) {
    terrainSkirt.visible = value > 0.001;
    terrainSkirt.castShadow = value >= 0.85;
  }
  if (terrainOpacityInput) {
    terrainOpacityInput.dataset.terrainOpacity = value.toFixed(2);
  }
}

function buildContours() {
  const positions = [];
  const dx = width / (gridSize - 1);
  const dz = depth / (gridSize - 1);
  const interval = 20;
  const startLevel = Math.ceil((minElevation + 5) / interval) * interval;

  for (let level = startLevel; level < maxElevation - 2; level += interval) {
    for (let row = 0; row < gridSize - 1; row += 1) {
      for (let col = 0; col < gridSize - 1; col += 1) {
        const h00 = heights[row * gridSize + col];
        const h10 = heights[row * gridSize + col + 1];
        const h01 = heights[(row + 1) * gridSize + col];
        const h11 = heights[(row + 1) * gridSize + col + 1];
        const crossings = [];

        addCrossing(
          crossings,
          h00,
          h10,
          level,
          col,
          row,
          col + 1,
          row,
          dx,
          dz,
        );
        addCrossing(
          crossings,
          h10,
          h11,
          level,
          col + 1,
          row,
          col + 1,
          row + 1,
          dx,
          dz,
        );
        addCrossing(
          crossings,
          h11,
          h01,
          level,
          col + 1,
          row + 1,
          col,
          row + 1,
          dx,
          dz,
        );
        addCrossing(
          crossings,
          h01,
          h00,
          level,
          col,
          row + 1,
          col,
          row,
          dx,
          dz,
        );

        for (let index = 0; index + 1 < crossings.length; index += 2) {
          const first = crossings[index];
          const second = crossings[index + 1];
          positions.push(
            first.x,
            level - minElevation + 0.45,
            first.z,
            second.x,
            level - minElevation + 0.45,
            second.z,
          );
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  contourLines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: activeStyle.contour,
      transparent: true,
      opacity: 0.27,
      depthWrite: false,
    }),
  );
  contourLines.name = "20 metre contours";
  contourLines.visible = showContoursInput.checked;
  contourLines.renderOrder = 1;
  terrainGroup.add(contourLines);
}

function addCrossing(
  crossings,
  valueA,
  valueB,
  level,
  colA,
  rowA,
  colB,
  rowB,
  dx,
  dz,
) {
  if ((valueA < level) === (valueB < level)) return;
  const fraction = (level - valueA) / (valueB - valueA);
  const col = colA + (colB - colA) * fraction;
  const row = rowA + (rowB - rowA) * fraction;
  crossings.push({
    x: -width / 2 + col * dx,
    z: -depth / 2 + row * dz,
  });
}

function localFromLonLat(lon, lat) {
  const b = window.SCENE_GEO_BOUNDS || metadata.bounds;
  if (!b) return { x: 0, z: 0 };
  return {
    x: ((lon - b.west) / (b.east - b.west) - 0.5) * width,
    z: ((b.north - lat) / (b.north - b.south) - 0.5) * depth,
  };
}

function terrainElevationAt(x, z) {
  const gridX = THREE.MathUtils.clamp(
    ((x + width / 2) / width) * (gridSize - 1),
    0,
    gridSize - 1,
  );
  const gridZ = THREE.MathUtils.clamp(
    ((z + depth / 2) / depth) * (gridSize - 1),
    0,
    gridSize - 1,
  );
  const col0 = Math.floor(gridX);
  const row0 = Math.floor(gridZ);
  const col1 = Math.min(gridSize - 1, col0 + 1);
  const row1 = Math.min(gridSize - 1, row0 + 1);
  const tx = gridX - col0;
  const tz = gridZ - row0;
  const top = THREE.MathUtils.lerp(
    heights[row0 * gridSize + col0],
    heights[row0 * gridSize + col1],
    tx,
  );
  const bottom = THREE.MathUtils.lerp(
    heights[row1 * gridSize + col0],
    heights[row1 * gridSize + col1],
    tx,
  );
  return (
    THREE.MathUtils.lerp(top, bottom, tz) - minElevation
  );
}

function buildRideRoute() {
  if (!RIDE_ROUTE || !Array.isArray(RIDE_ROUTE.points) || RIDE_ROUTE.points.length < 2) return;
  const pts = RIDE_ROUTE.points;
  const n = pts.length;
  rideXs = new Float32Array(n);
  rideZs = new Float32Array(n);
  rideRawYs = new Float32Array(n);
  const routeBase = 110;
  const altScale = 8;

  for (let i = 0; i < n; i += 1) {
    const p = localFromLonLat(pts[i].lon, pts[i].lat);
    rideXs[i] = p.x;
    rideZs[i] = p.z;
    rideRawYs[i] = routeBase + (Number(pts[i].alt) || 0) * altScale;
  }
  rideGroundYs = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    rideGroundYs[i] = terrainElevationAt(rideXs[i], rideZs[i]);
  }

  rideBounds = {
    minX: Math.min(...rideXs),
    maxX: Math.max(...rideXs),
    minZ: Math.min(...rideZs),
    maxZ: Math.max(...rideZs),
  };
  rideMeanY = 0;
  for (let i = 0; i < n; i += 1) rideMeanY += rideRawYs[i];
  rideMeanY /= n;

  buildRideProjection();
  buildRideMapProjection();

  rideGroup = new THREE.Group();
  rideGroup.name = "Ride route";

  rideCoreMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ color: 0x6fd8ff, depthTest: false }),
  );
  rideCoreMesh.renderOrder = 21;
  rideGroup.add(rideCoreMesh);

  rideGlowMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({
      color: 0x3aa8ff,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
  );
  rideGlowMesh.renderOrder = 20;
  rideGroup.add(rideGlowMesh);

  rideStartMarker = new THREE.Mesh(
    new THREE.SphereGeometry(8, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x2f8f5b, depthTest: false }),
  );
  rideStartMarker.renderOrder = 22;
  rideGroup.add(rideStartMarker);

  rideEndMarker = new THREE.Mesh(
    new THREE.SphereGeometry(8, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xc0392b, depthTest: false }),
  );
  rideEndMarker.renderOrder = 22;
  rideGroup.add(rideEndMarker);

  ridePulse = new THREE.Mesh(
    new THREE.SphereGeometry(5.2, 16, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
  );
  ridePulse.renderOrder = 23;
  rideGroup.add(ridePulse);

  scene.add(rideGroup);
  rebuildRideTubes(Number(exaggerationInput.value));

  routeSlider = document.getElementById("route-position");
  routeSliderValue = document.getElementById("route-position-value");
  if (routeSlider) {
    const schedulePulseRest = () => {
      clearTimeout(pulseActiveTimer);
      pulseActiveTimer = setTimeout(() => {
        ridePulseActive = false;
      }, 600);
    };
    const scheduleRideResume = () => {
      clearTimeout(rideResumeTimer);
      rideResumeTimer = setTimeout(() => {
        rideAuto = true;
      }, 20000);
    };
    const endRouteSliderInteraction = () => {
      if (!routeSliderPointerActive) return;
      routeSliderPointerActive = false;
      schedulePulseRest();
      scheduleRideResume();
    };

    routeSlider.addEventListener("pointerdown", () => {
      routeSliderPointerActive = true;
      ridePulseActive = true;
      rideAuto = false;
      clearTimeout(pulseActiveTimer);
      scheduleRideResume();
    });
    routeSlider.addEventListener("pointerup", endRouteSliderInteraction);
    routeSlider.addEventListener("pointercancel", endRouteSliderInteraction);
    routeSlider.addEventListener("blur", endRouteSliderInteraction);
    routeSlider.addEventListener("input", () => {
      rideAuto = false;
      ridePulseActive = true;
      if (!routeSliderPointerActive) schedulePulseRest();
      rideProgress = Number(routeSlider.value) / 1000;
      updateRidePulse(rideProgress);
      if (routeSliderValue) {
        routeSliderValue.textContent = `${Math.round(rideProgress * 100)}%`;
      }
      scheduleRideResume();
    });
  }

  const routeStatus = document.getElementById("status-message");
  if (routeStatus) {
    routeStatus.textContent =
      `悬浮路线、地形投影与地图投影已叠加：${n} 个点 · ${((RIDE_ROUTE.distance || 0) / 1000).toFixed(2)} km`;
  }
}

function buildRideMapProjection() {
  if (!baseMapMesh || !rideXs || !rideZs) return;
  const n = rideXs.length;
  const step = Math.max(1, Math.floor(n / 420));
  const mapPoints = [];
  for (let i = 0; i < n; i += step) {
    mapPoints.push(new THREE.Vector3(rideXs[i], 0, rideZs[i]));
  }
  mapPoints.push(new THREE.Vector3(
    rideXs[n - 1],
    0,
    rideZs[n - 1],
  ));
  const mapCurve = new THREE.CatmullRomCurve3(
    mapPoints,
    false,
    "centripetal",
    0.2,
  );

  rideMapProjectionGroup = new THREE.Group();
  rideMapProjectionGroup.name = "Ride map-plane projection";

  const mapProjectionCore = new THREE.Mesh(
    new THREE.TubeGeometry(mapCurve, 720, 0.84, 6, false),
    new THREE.MeshBasicMaterial({
      color: 0xbff8ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  mapProjectionCore.renderOrder = 8;
  rideMapProjectionGroup.add(mapProjectionCore);

  const mapProjectionGlow = new THREE.Mesh(
    new THREE.TubeGeometry(mapCurve, 720, 2.3, 6, false),
    new THREE.MeshBasicMaterial({
      color: 0x47c7e8,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  mapProjectionGlow.renderOrder = 7;
  rideMapProjectionGroup.add(mapProjectionGlow);

  const mapMarkerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff2418,
    transparent: true,
    opacity: 0.98,
    blending: THREE.NormalBlending,
    depthWrite: false,
    toneMapped: false,
  });
  rideMapProjectionPulse = new THREE.Group();
  rideMapProjectionPulse.name = "Map-plane ride cursor";
  const mapCursorRing = new THREE.Mesh(
    new THREE.TorusGeometry(10.5, 0.9, 8, 44),
    mapMarkerMaterial,
  );
  mapCursorRing.rotation.x = -Math.PI / 2;
  const mapCursorCenter = new THREE.Mesh(
    new THREE.CircleGeometry(3.0, 30),
    mapMarkerMaterial,
  );
  mapCursorCenter.rotation.x = -Math.PI / 2;
  const mapCursorHalo = new THREE.Mesh(
    new THREE.RingGeometry(13, 16, 48),
    new THREE.MeshBasicMaterial({
      color: 0xff493d,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mapCursorHalo.rotation.x = -Math.PI / 2;
  rideMapProjectionPulse.add(
    mapCursorHalo,
    mapCursorRing,
    mapCursorCenter,
  );
  rideMapProjectionPulse.renderOrder = 9;
  rideMapProjectionGroup.add(rideMapProjectionPulse);

  rideMapProjectionGroup.visible = false;
  scene.add(rideMapProjectionGroup);
  updateRideMapProjectionHeight();
}

function buildRideProjection() {
  if (!terrainGroup || !rideXs || !rideZs || !rideGroundYs) return;
  const n = rideXs.length;
  const step = Math.max(1, Math.floor(n / 420));
  const groundPoints = [];
  for (let i = 0; i < n; i += step) {
    groundPoints.push(new THREE.Vector3(
      rideXs[i],
      rideGroundYs[i] + 2.2,
      rideZs[i],
    ));
  }
  groundPoints.push(new THREE.Vector3(
    rideXs[n - 1],
    rideGroundYs[n - 1] + 2.2,
    rideZs[n - 1],
  ));

  rideProjectionGroup = new THREE.Group();
  rideProjectionGroup.name = "Ride terrain projection";
  terrainGroup.add(rideProjectionGroup);

  const projectionCurve = new THREE.CatmullRomCurve3(
    groundPoints,
    false,
    "centripetal",
    0.2,
  );
  rideProjectionCoreMesh = new THREE.Mesh(
    new THREE.TubeGeometry(projectionCurve, 720, 0.55, 6, false),
    new THREE.MeshBasicMaterial({
      color: 0x9beeff,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  rideProjectionCoreMesh.renderOrder = 5;
  rideProjectionGroup.add(rideProjectionCoreMesh);

  rideProjectionGlowMesh = new THREE.Mesh(
    new THREE.TubeGeometry(projectionCurve, 720, 1.35, 6, false),
    new THREE.MeshBasicMaterial({
      color: 0x3aa8ff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  rideProjectionGlowMesh.renderOrder = 4;
  rideProjectionGroup.add(rideProjectionGlowMesh);

  rideHeightCurtain = createRideHeightCurtain();
  rideProjectionGroup.add(rideHeightCurtain);

  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9fbff,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  rideProjectionPulse = new THREE.Group();
  rideProjectionPulse.name = "Projected ride cursor";
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(8, 0.7, 6, 40),
    markerMaterial,
  );
  ring.rotation.x = -Math.PI / 2;
  const center = new THREE.Mesh(
    new THREE.CircleGeometry(2.7, 28),
    markerMaterial,
  );
  center.rotation.x = -Math.PI / 2;
  rideProjectionPulse.add(ring, center);
  rideProjectionPulse.renderOrder = 7;
  rideProjectionGroup.add(rideProjectionPulse);

  const tetherGeometry = new THREE.BufferGeometry();
  tetherGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(6), 3),
  );
  rideProjectionTether = new THREE.Line(
    tetherGeometry,
    new THREE.LineDashedMaterial({
      color: 0xb9f2ff,
      dashSize: 7,
      gapSize: 5,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  rideProjectionTether.renderOrder = 6;
  rideProjectionGroup.add(rideProjectionTether);
}

function createRideHeightCurtain() {
  const n = rideXs.length;
  const step = Math.max(1, Math.floor(n / 500));
  const sampleIndices = [];
  for (let i = 0; i < n; i += step) sampleIndices.push(i);
  if (sampleIndices[sampleIndices.length - 1] !== n - 1) {
    sampleIndices.push(n - 1);
  }

  const positions = [];
  const colors = [];
  const indices = [];
  const lowColor = new THREE.Color(0x216b82);
  const highColor = new THREE.Color(0xdffaff);
  const scratch = new THREE.Color();
  const minY = Math.min(...rideRawYs);
  const maxY = Math.max(...rideRawYs);
  const range = Math.max(1, maxY - minY);

  for (const index of sampleIndices) {
    const altitudeMix = THREE.MathUtils.clamp(
      (rideRawYs[index] - minY) / range,
      0,
      1,
    );
    scratch.copy(lowColor).lerp(highColor, altitudeMix);
    positions.push(
      rideXs[index],
      rideRawYs[index],
      rideZs[index],
      rideXs[index],
      rideGroundYs[index] + 1.5,
      rideZs[index],
    );
    colors.push(
      scratch.r,
      scratch.g,
      scratch.b,
      lowColor.r * 0.36,
      lowColor.g * 0.36,
      lowColor.b * 0.36,
    );
  }

  for (let i = 0; i < sampleIndices.length - 1; i += 1) {
    const topA = i * 2;
    const bottomA = topA + 1;
    const topB = topA + 2;
    const bottomB = topA + 3;
    indices.push(topA, bottomA, topB, bottomA, bottomB, topB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3),
  );
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  const curtain = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.045,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  curtain.name = "Ride height curtain";
  curtain.renderOrder = 3;
  return curtain;
}

function rebuildRideTubes(exaggeration) {
  if (!rideGroup || !rideXs || !rideRawYs) return;
  const n = rideXs.length;
  const step = Math.max(1, Math.floor(n / 360));
  const curvePoints = [];
  for (let i = 0; i < n; i += step) {
    curvePoints.push(new THREE.Vector3(
      rideXs[i],
      rideRawYs[i] * exaggeration,
      rideZs[i],
    ));
  }
  curvePoints.push(new THREE.Vector3(
    rideXs[n - 1],
    rideRawYs[n - 1] * exaggeration,
    rideZs[n - 1],
  ));

  const curve = new THREE.CatmullRomCurve3(curvePoints, false, "centripetal", 0.2);
  rideCurve = curve;

  if (rideCoreMesh) {
    rideCoreMesh.geometry.dispose();
    rideCoreMesh.geometry = new THREE.TubeGeometry(curve, 720, 1.6, 8, false);
  }
  if (rideGlowMesh) {
    rideGlowMesh.geometry.dispose();
    rideGlowMesh.geometry = new THREE.TubeGeometry(curve, 720, 3.0, 8, false);
  }
  if (rideStartMarker) {
    rideStartMarker.position.set(
      rideXs[0],
      rideRawYs[0] * exaggeration + 8,
      rideZs[0],
    );
  }
  if (rideEndMarker) {
    rideEndMarker.position.set(
      rideXs[n - 1],
      rideRawYs[n - 1] * exaggeration + 8,
      rideZs[n - 1],
    );
  }
  if (ridePulse) {
    updateRidePulse(rideProgress);
  }
}

function updateRidePulse(progress) {
  if (!ridePulse || !rideCurve) return;
  const clamped = Math.max(0, Math.min(1, progress));
  const point = rideCurve.getPointAt(clamped);
  ridePulse.position.copy(point);
  if (rideMapProjectionPulse) {
    rideMapProjectionPulse.position.set(point.x, 0, point.z);
  }
  if (!rideProjectionPulse || !rideProjectionTether) return;

  const groundY = terrainElevationAt(point.x, point.z);
  rideProjectionPulse.position.set(point.x, groundY + 3.2, point.z);

  const terrainScale = Math.max(0.01, Number(exaggerationInput.value));
  const tetherPositions =
    rideProjectionTether.geometry.getAttribute("position");
  tetherPositions.setXYZ(0, point.x, groundY + 3.2, point.z);
  tetherPositions.setXYZ(1, point.x, point.y / terrainScale, point.z);
  tetherPositions.needsUpdate = true;
  rideProjectionTether.computeLineDistances();
}

function buildMarkers() {
  if (activeStyle.artistic) return;
  let peakIndex = 0;
  for (let index = 1; index < heights.length; index += 1) {
    if (heights[index] > heights[peakIndex]) peakIndex = index;
  }
  const peakRow = Math.floor(peakIndex / gridSize);
  const peakCol = peakIndex % gridSize;
  const dx = width / (gridSize - 1);
  const dz = depth / (gridSize - 1);
  peakPosition = new THREE.Vector3(
    -width / 2 + peakCol * dx,
    heights[peakIndex] - minElevation,
    -depth / 2 + peakRow * dz,
  );

  const markerMaterial = new THREE.MeshStandardMaterial({
    color: "#a96343",
    roughness: 0.52,
    metalness: 0,
    emissive: "#432014",
    emissiveIntensity: 0.18,
  });
  peakMarker = new THREE.Group();
  const dot = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 12), markerMaterial);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(27, 1.6, 8, 32),
    markerMaterial,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3;
  peakMarker.add(dot, ring);
  scene.add(peakMarker);
  updateMarkerHeights();
}

function createLocationMarker() {
  if (locationMarker) return;
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: "#c65f3d",
    roughness: 0.5,
    emissive: "#7d2f1c",
    emissiveIntensity: 0.25,
  });
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 75, 10),
    material,
  );
  stem.position.y = 37;
  const head = new THREE.Mesh(new THREE.SphereGeometry(15, 18, 14), material);
  head.position.y = 78;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(29, 1.8, 8, 36),
    material,
  );
  ring.rotation.x = Math.PI / 2;
  group.add(stem, head, ring);
  group.visible = false;
  scene.add(group);
  locationMarker = group;
}

function updateMarkerHeights() {
  const scale = Number(exaggerationInput.value);
  if (peakMarker && peakPosition) {
    peakMarker.position.set(
      peakPosition.x,
      peakPosition.y * scale + 3,
      peakPosition.z,
    );
  }
  if (locationMarker && locationPosition) {
    locationMarker.position.set(
      locationPosition.x,
      locationPosition.y * scale,
      locationPosition.z,
    );
  }
  if (groundPlane) {
    groundPlane.position.y = -baseDepth * scale - 12;
  }
  const softShadow = groundPlane?.userData.softShadow;
  if (softShadow) {
    softShadow.position.y = -baseDepth * scale - 11.5;
  }
  if (baseMapMesh) {
    baseMapMesh.position.y = -baseDepth * scale - 5;
    updateRideMapProjectionHeight();
  }
}

function createSoftShadow() {
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 512;
  shadowCanvas.height = 512;
  const context = shadowCanvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(256, 256, 25, 256, 256, 230);
  gradient.addColorStop(0, "rgba(45,55,43,0.18)");
  gradient.addColorStop(0.48, "rgba(45,55,43,0.08)");
  gradient.addColorStop(1, "rgba(45,55,43,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(shadowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.55, depth * 1.55),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
      side: THREE.DoubleSide,
    }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -95;
  plane.renderOrder = -1;
  plane.name = "Contact shadow";
  groundPlane.userData.softShadow = plane;
  return plane;
}

function getGeoBounds() {
  return window.SCENE_GEO_BOUNDS || metadata.bounds || null;
}

function updateRideMapProjectionHeight() {
  if (!rideMapProjectionGroup) return;
  const mapY = baseMapMesh
    ? baseMapMesh.position.y
    : -baseDepth * Number(exaggerationInput.value) - 5;
  rideMapProjectionGroup.position.y = mapY + 2.4;
  if (baseMapToggle) {
    baseMapToggle.dataset.mapProjectionY =
      rideMapProjectionGroup.position.y.toFixed(2);
  }
}

function syncRideMapProjectionVisibility() {
  if (!rideMapProjectionGroup) return;
  const showRoute = document.getElementById("show-route");
  rideMapProjectionGroup.visible = Boolean(
    baseMapMesh?.visible && (showRoute?.checked ?? true),
  );
  if (baseMapToggle) {
    baseMapToggle.dataset.routeProjection =
      rideMapProjectionGroup.visible ? "1" : "0";
  }
}

function createBaseMapLayer() {
  baseMapToggle = document.getElementById("show-basemap");
  baseMapProviderSelect = document.getElementById("basemap-provider");
  if (!baseMapToggle || !getGeoBounds()) return;

  baseMapMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      color: 0xe9e5da,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  baseMapMesh.name = "OpenStreetMap base";
  baseMapMesh.rotation.x = -Math.PI / 2;
  baseMapMesh.visible = false;
  baseMapMesh.renderOrder = -3;
  baseMapMesh.position.y =
    -baseDepth * Number(exaggerationInput.value) - 5;
  scene.add(baseMapMesh);
  baseMapToggle.dataset.mapState = "off";
}

function showBaseMap() {
  if (!baseMapMesh) return;
  baseMapMesh.visible = true;
  syncRideMapProjectionVisibility();
  const token = ++baseMapLoadToken;

  if (!baseMapTexture) {
    const local = createOfflineOsmTexture();
    baseMapLocalTexture = local.texture;
    applyBaseMapTexture(local.texture, local.bounds);
  }
  baseMapToggle.dataset.mapState =
    baseMapTexture === baseMapOnlineTexture ? "osm-online" : "osm-local";

  const provider = baseMapProviderSelect?.value || "osm";
  if (provider !== "osm") {
    announce("该地图来源尚未接入");
    return;
  }

  if (baseMapOnlineTexture) {
    applyBaseMapTexture(baseMapOnlineTexture, baseMapOnlineTexture.userData.bounds);
    announce("OpenStreetMap 在线地图已显示");
    return;
  }

  if (baseMapOnlineAttempted && !baseMapOnlineLoadPromise) {
    announce("OpenStreetMap 本地路网底图已显示");
    return;
  }

  announce("OpenStreetMap 路网底图已显示，正在加载在线瓦片…");
  if (!baseMapOnlineAttempted && !baseMapOnlineLoadPromise) {
    baseMapOnlineLoadPromise = loadOnlineOsmBasemap(token).finally(() => {
      baseMapOnlineLoadPromise = null;
    });
  }
}

function hideBaseMap() {
  baseMapLoadToken += 1;
  if (baseMapMesh) baseMapMesh.visible = false;
  syncRideMapProjectionVisibility();
  if (baseMapToggle) baseMapToggle.dataset.mapState = "off";
  announce("真实地图底板已关闭");
}

function applyBaseMapTexture(texture, bounds) {
  if (!baseMapMesh) return;
  texture.userData.bounds = { ...bounds };
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy(),
  );
  texture.needsUpdate = true;
  baseMapTexture = texture;
  baseMapMesh.material.map = texture;
  baseMapMesh.material.color.set(0xffffff);
  baseMapMesh.material.needsUpdate = true;
  placeBaseMapMesh(bounds);
}

function placeBaseMapMesh(mapBounds) {
  if (!baseMapMesh) return;
  const sceneBounds = getGeoBounds();
  if (!sceneBounds) return;
  const widthRatio =
    (mapBounds.east - mapBounds.west) /
    (sceneBounds.east - sceneBounds.west);
  const depthRatio =
    (mapBounds.north - mapBounds.south) /
    (sceneBounds.north - sceneBounds.south);
  const centerLon = (mapBounds.west + mapBounds.east) / 2;
  const centerLat = (mapBounds.south + mapBounds.north) / 2;
  const centerX = (
    (centerLon - sceneBounds.west) /
      (sceneBounds.east - sceneBounds.west) -
    0.5
  ) * width;
  const centerZ = (
    (sceneBounds.north - centerLat) /
      (sceneBounds.north - sceneBounds.south) -
    0.5
  ) * depth;

  baseMapMesh.geometry.dispose();
  baseMapMesh.geometry = new THREE.PlaneGeometry(
    width * widthRatio,
    depth * depthRatio,
  );
  baseMapMesh.position.x = centerX;
  baseMapMesh.position.z = centerZ;
  baseMapMesh.position.y =
    -baseDepth * Number(exaggerationInput.value) - 5;
  updateRideMapProjectionHeight();
}

function createOfflineOsmTexture() {
  const sceneBounds = getGeoBounds();
  const lonPad = (sceneBounds.east - sceneBounds.west) * 0.2;
  const latPad = (sceneBounds.north - sceneBounds.south) * 0.2;
  const bounds = {
    west: sceneBounds.west - lonPad,
    east: sceneBounds.east + lonPad,
    south: sceneBounds.south - latPad,
    north: sceneBounds.north + latPad,
  };
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = Math.round(
    canvas.width *
      ((bounds.north - bounds.south) * depth) /
      ((bounds.east - bounds.west) * width),
  );
  const context = canvas.getContext("2d");
  context.fillStyle = "#e9e5d9";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const toCanvas = (x, z) => {
    const lon =
      sceneBounds.west + (x / width + 0.5) *
        (sceneBounds.east - sceneBounds.west);
    const lat =
      sceneBounds.north - (z / depth + 0.5) *
        (sceneBounds.north - sceneBounds.south);
    return {
      x: ((lon - bounds.west) / (bounds.east - bounds.west)) * canvas.width,
      y: ((bounds.north - lat) / (bounds.north - bounds.south)) * canvas.height,
    };
  };

  context.fillStyle = "#b8d8df";
  for (const body of DATA.waterBodies || []) {
    if (!body.outer || body.outer.length < 3) continue;
    context.beginPath();
    body.outer.forEach(([x, z], index) => {
      const point = toCanvas(x, z);
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    for (const hole of body.holes || []) {
      if (hole.length < 3) continue;
      hole.forEach(([x, z], index) => {
        const point = toCanvas(x, z);
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
    }
    context.fill("evenodd");
  }

  const roadOrder = [
    "service",
    "minor_construction",
    "minor",
    "tertiary_construction",
    "tertiary",
    "secondary",
    "primary",
    "trunk",
    "motorway",
  ];
  const roads = CITY_DATA?.roads || [];
  const drawRoads = (casing) => {
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const category of roadOrder) {
      for (const road of roads) {
        if ((road.c || "minor") !== category || road.p?.length < 2) continue;
        const pixelWidth = Math.max(
          1.8,
          (road.w || 6) * (canvas.width / width),
        );
        context.beginPath();
        road.p.forEach(([x, z], index) => {
          const point = toCanvas(x, z);
          if (index === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.lineWidth = casing ? pixelWidth + 1.8 : pixelWidth;
        context.strokeStyle = casing ? "rgba(111, 105, 91, .42)" : "#fcfbf6";
        context.stroke();
      }
    }
  };
  drawRoads(true);
  drawRoads(false);

  context.fillStyle = "rgba(66, 75, 63, .62)";
  context.font = '600 17px "Segoe UI", sans-serif';
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.fillText(
    "OpenStreetMap · 离线路网",
    canvas.width - 24,
    canvas.height - 20,
  );

  return { texture: new THREE.CanvasTexture(canvas), bounds };
}

function tileXFromLon(lon, zoom) {
  return ((lon + 180) / 360) * (2 ** zoom);
}

function tileYFromLat(lat, zoom) {
  const radians = THREE.MathUtils.degToRad(lat);
  return (
    (1 - Math.asinh(Math.tan(radians)) / Math.PI) /
    2 *
    2 ** zoom
  );
}

function lonFromTileX(x, zoom) {
  return (x / (2 ** zoom)) * 360 - 180;
}

function latFromTileY(y, zoom) {
  return THREE.MathUtils.radToDeg(
    Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / (2 ** zoom)))),
  );
}

function selectOsmTileRange(bounds, maxTiles = 24) {
  for (let zoom = 16; zoom >= 11; zoom -= 1) {
    const count = 2 ** zoom;
    const x0 = THREE.MathUtils.clamp(
      Math.floor(tileXFromLon(bounds.west, zoom)),
      0,
      count - 1,
    );
    const x1 = THREE.MathUtils.clamp(
      Math.floor(tileXFromLon(bounds.east, zoom)),
      0,
      count - 1,
    );
    const y0 = THREE.MathUtils.clamp(
      Math.floor(tileYFromLat(bounds.north, zoom)),
      0,
      count - 1,
    );
    const y1 = THREE.MathUtils.clamp(
      Math.floor(tileYFromLat(bounds.south, zoom)),
      0,
      count - 1,
    );
    if ((x1 - x0 + 1) * (y1 - y0 + 1) <= maxTiles) {
      return { zoom, x0, x1, y0, y1 };
    }
  }
  return { zoom: 11, x0: 0, x1: 0, y0: 0, y1: 0 };
}

function loadTileImage(url, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => {
      image.src = "";
      reject(new Error("tile timeout"));
    }, timeoutMs);
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error("tile failed"));
    };
    image.src = url;
  });
}

async function loadOnlineOsmBasemap(token) {
  baseMapOnlineAttempted = true;
  const bounds = getGeoBounds();
  if (!bounds) return;
  const range = selectOsmTileRange(bounds);
  const tileKeys = [];
  for (let y = range.y0; y <= range.y1; y += 1) {
    for (let x = range.x0; x <= range.x1; x += 1) {
      tileKeys.push({ x, y });
    }
  }
  const centerKey =
    tileKeys[Math.floor(tileKeys.length / 2)] || tileKeys[0];

  try {
    const tileUrl = (tile) =>
      `${OSM_TILE_URL}/${range.zoom}/${tile.x}/${tile.y}.png`;
    const probe = await loadTileImage(tileUrl(centerKey));
    const tiles = await Promise.all(
      tileKeys.map((tile) =>
        tile === centerKey
          ? probe
          : loadTileImage(tileUrl(tile)),
      ),
    );
    const columns = range.x1 - range.x0 + 1;
    const rows = range.y1 - range.y0 + 1;
    const canvas = document.createElement("canvas");
    canvas.width = columns * OSM_TILE_SIZE;
    canvas.height = rows * OSM_TILE_SIZE;
    const context = canvas.getContext("2d");
    tiles.forEach((image, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      context.drawImage(
        image,
        column * OSM_TILE_SIZE,
        row * OSM_TILE_SIZE,
        OSM_TILE_SIZE,
        OSM_TILE_SIZE,
      );
    });

    const mapBounds = {
      west: lonFromTileX(range.x0, range.zoom),
      east: lonFromTileX(range.x1 + 1, range.zoom),
      north: latFromTileY(range.y0, range.zoom),
      south: latFromTileY(range.y1 + 1, range.zoom),
    };
    baseMapOnlineTexture = new THREE.CanvasTexture(canvas);
    baseMapOnlineTexture.userData.bounds = mapBounds;
    applyBaseMapTexture(baseMapOnlineTexture, mapBounds);
    if (baseMapToggle) baseMapToggle.dataset.mapState = "osm-online";
    if (baseMapToggle?.checked) {
      announce(`OpenStreetMap 在线地图已显示 · Zoom ${range.zoom}`);
    }
  } catch {
    if (token === baseMapLoadToken && baseMapToggle?.checked) {
      announce("在线瓦片暂不可用，已使用本地 OSM 路网底图");
    }
  }
}

function bindUI() {
  exaggerationInput.addEventListener("input", () => {
    const value = Number(exaggerationInput.value);
    exaggerationValue.textContent = `${value.toFixed(1)} ×`;
    terrainGroup.scale.y = value;
    if (rideGroup) rebuildRideTubes(value);
    if (rideMeanY != null) controls.target.y = rideMeanY * value;
    updateMarkerHeights();
    setSliderProgress(exaggerationInput, 1, 6, value);
  });
  setSliderProgress(exaggerationInput, 1, 6, initialExaggeration);

  if (terrainOpacityInput) {
    terrainOpacityInput.addEventListener("input", () => {
      const value = Number(terrainOpacityInput.value);
      if (terrainOpacityValue) terrainOpacityValue.textContent = `${value}%`;
      applyTerrainOpacity(value);
      setSliderProgress(terrainOpacityInput, 0, 100, value);
    });
    terrainOpacityInput.addEventListener("change", () => {
      announce(`地形不透明度 ${terrainOpacityInput.value}%`);
    });
    applyTerrainOpacity(Number(terrainOpacityInput.value));
    setSliderProgress(
      terrainOpacityInput,
      0,
      100,
      Number(terrainOpacityInput.value),
    );
  }

  if (cityGroup) {
    cityOpacityInput.addEventListener("input", () => {
      const value = Number(cityOpacityInput.value);
      cityOpacityValue.textContent = `${value}%`;
      applyCityOpacity(value);
      setSliderProgress(cityOpacityInput, 20, 100, value);
    });
    cityOpacityInput.addEventListener("change", () => {
      announce(`城市层不透明度 ${cityOpacityInput.value}%`);
    });
    showBuildingsInput.addEventListener("change", () => {
      cityBuildings.visible = showBuildingsInput.checked;
    });
    showRoadsInput.addEventListener("change", () => {
      cityRoads.visible = showRoadsInput.checked;
    });
    applyCityOpacity(Number(cityOpacityInput.value));
    setSliderProgress(
      cityOpacityInput,
      0,
      100,
      Number(cityOpacityInput.value),
    );
  }

  showWaterInput.addEventListener("change", () => {
    waterGroup.visible = showWaterInput.checked;
  });
  showContoursInput.addEventListener("change", () => {
    contourLines.visible = showContoursInput.checked;
  });
  const showRouteInput = document.getElementById("show-route");
  if (showRouteInput && rideGroup) {
    showRouteInput.addEventListener("change", () => {
      rideGroup.visible = showRouteInput.checked;
      if (rideProjectionGroup) {
        rideProjectionGroup.visible = showRouteInput.checked;
      }
      syncRideMapProjectionVisibility();
    });
  }
  if (baseMapToggle) {
    baseMapToggle.addEventListener("change", () => {
      if (baseMapToggle.checked) showBaseMap();
      else hideBaseMap();
    });
  }
  if (baseMapProviderSelect) {
    baseMapProviderSelect.addEventListener("change", () => {
      if (baseMapProviderSelect.value !== "osm") {
        baseMapProviderSelect.value = "osm";
        announce("当前仅接入 OpenStreetMap");
        return;
      }
      if (baseMapToggle?.checked) showBaseMap();
    });
  }
  autoRotateInput.addEventListener("change", () => {
    controls.autoRotate =
      autoRotateInput.checked && !prefersReducedMotion;
    announce(autoRotateInput.checked ? "自动旋转已开启" : "自动旋转已关闭");
  });

  document.getElementById("reset-view").addEventListener("click", () => {
    resetView(true);
  });
  document.getElementById("locate-me")?.addEventListener("click", locateUser);
  document.getElementById("export-glb").addEventListener("click", exportGLB);
  document.getElementById("toggle-fullscreen").addEventListener("click", toggleFullscreen);
  controls.addEventListener("start", hideHint);
}

function setSliderProgress(input, min, max, value) {
  const percentage = ((value - min) / (max - min)) * 100;
  input.style.setProperty("--range-progress", `${percentage}%`);
}

function resetView(announceChange) {
  const isNarrow = window.innerWidth < 720;
  const distanceFactor = isNarrow ? 1.3 : 1;
  const targetY = heightSpan * Number(exaggerationInput.value) * 0.22;
  if (rideBounds) {
    const centerX = (rideBounds.minX + rideBounds.maxX) / 2;
    const centerZ = (rideBounds.minZ + rideBounds.maxZ) / 2;
    const routeTargetY = rideMeanY != null
      ? rideMeanY * Number(exaggerationInput.value)
      : targetY;
    const rideSpan = Math.max(
      rideBounds.maxX - rideBounds.minX,
      rideBounds.maxZ - rideBounds.minZ,
      500,
    );
    controls.target.set(centerX, routeTargetY, centerZ);
    camera.position.set(
      centerX + rideSpan * 0.18 * distanceFactor,
      rideSpan * 1.45 * distanceFactor,
      centerZ + rideSpan * 1.35 * distanceFactor,
    );
    controls.update();
    if (announceChange) announce("视角已复位");
    return;
  }
  controls.target.set(0, targetY, 0);
  camera.position.set(
    width * 0.9 * distanceFactor,
    1600 * distanceFactor,
    depth * 1.16 * distanceFactor,
  );
  controls.update();
  if (announceChange) announce("视角已复位");
}

function locateUser() {
  if (!navigator.geolocation) {
    announce("当前浏览器不支持定位");
    return;
  }
  const button = document.getElementById("locate-me");
  button.disabled = true;
  announce("正在请求 GPS 位置…");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      button.disabled = false;
      const { latitude, longitude } = position.coords;
      const bounds = metadata.bounds;
      const inside =
        longitude >= bounds.west &&
        longitude <= bounds.east &&
        latitude >= bounds.south &&
        latitude <= bounds.north;
      if (!inside) {
        announce("当前位置在广钢新城模型范围外");
        return;
      }

      const metersPerLon = 111320 * Math.cos(THREE.MathUtils.degToRad(metadata.center[1]));
      const x = (longitude - metadata.center[0]) * metersPerLon;
      const z = (metadata.center[1] - latitude) * 110540;
      const elevation = elevationAt(x, z);
      locationPosition = new THREE.Vector3(
        x,
        elevation - minElevation,
        z,
      );
      createLocationMarker();
      locationMarker.visible = true;
      locationLabel.setAttribute("aria-hidden", "false");
      updateMarkerHeights();
      announce(`定位成功 · 误差约 ${Math.round(position.coords.accuracy)} 米`);
    },
    (error) => {
      button.disabled = false;
      const messages = {
        1: "定位权限未开启",
        2: "暂时无法获取 GPS 位置",
        3: "GPS 定位超时",
      };
      announce(messages[error.code] || "GPS 定位失败");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

function elevationAt(x, z) {
  const scaledCol = THREE.MathUtils.clamp(
    ((x + width / 2) / width) * (gridSize - 1),
    0,
    gridSize - 1,
  );
  const scaledRow = THREE.MathUtils.clamp(
    ((z + depth / 2) / depth) * (gridSize - 1),
    0,
    gridSize - 1,
  );
  const col = Math.floor(scaledCol);
  const row = Math.floor(scaledRow);
  const nextCol = Math.min(gridSize - 1, col + 1);
  const nextRow = Math.min(gridSize - 1, row + 1);
  const fx = scaledCol - col;
  const fz = scaledRow - row;
  const top =
    heights[row * gridSize + col] * (1 - fx) +
    heights[row * gridSize + nextCol] * fx;
  const bottom =
    heights[nextRow * gridSize + col] * (1 - fx) +
    heights[nextRow * gridSize + nextCol] * fx;
  return top * (1 - fz) + bottom * fz;
}

function exportGLB() {
  const button = document.getElementById("export-glb");
  button.disabled = true;
  announce("正在生成轻量 GLB…");
  const exportGroup = terrainGroup.clone(true);
  exportGroup.name = "Ganggong Park terrain export";
  const cityMetadata = CITY_DATA?.metadata;
  if (cityMetadata) {
    if (cityMetadata.artisticMode) {
      exportGroup.userData = {
        artisticMode: true,
        rulesetVersion: cityMetadata.artisticRulesetVersion,
        attribution: "OpenStreetMap contributors; procedural city generated for artistic display",
        note: "Artistic interpretation. Not a georeferenced map or survey product.",
      };
    } else {
      exportGroup.userData.sceneClassification = cityMetadata.scene ?? null;
      exportGroup.userData.sceneRules = cityMetadata.scene?.algorithmVersion;
      exportGroup.userData.buildingPlan = cityMetadata.buildingPlan ?? null;
      exportGroup.userData.buildingRules =
        cityMetadata.buildingRulesetVersion;
      exportGroup.userData.dataSource = cityMetadata.source;
    }
  }
  if (!cityMetadata?.artisticMode) {
    exportGroup.userData.terrainPlan = metadata.terrainPlan ?? null;
    exportGroup.userData.terrainRules =
      metadata.terrainRulesetVersion ?? null;
    exportGroup.userData.areaPlan = metadata.areaPlan ?? null;
    exportGroup.userData.areaRules =
      metadata.areaRulesetVersion ?? null;
  }
  exportGroup.traverse((object) => {
    if (object.isLine || object.isLineSegments) object.visible = false;
  });
  exportGroup.updateMatrixWorld(true);

  const exporter = new GLTFExporter();
  exporter.parse(
    exportGroup,
    (result) => {
      const blob = new Blob([result], { type: "model/gltf-binary" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const slug = metadata.slug ?? "terrain";
      link.download = cityMetadata?.artisticMode
        ? `${slug}-art-city.glb`
        : `${slug}-terrain.glb`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1500);
      button.disabled = false;
      announce(`GLB 已生成 · ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
    },
    (error) => {
      console.error(error);
      button.disabled = false;
      announce("GLB 导出失败");
    },
    { binary: true, onlyVisible: true, trs: true },
  );
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    announce("当前环境无法进入全屏");
  }
}

function resize() {
  if (!renderer || !camera) return;
  const nextWidth = window.innerWidth;
  const nextHeight = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(nextWidth, nextHeight, false);
  camera.aspect = nextWidth / nextHeight;
  camera.updateProjectionMatrix();
}

function createCompassHud() {
  if (compassDial) return;
  if (!document.getElementById("scene-compass-style")) {
    const style = document.createElement("style");
    style.id = "scene-compass-style";
    style.textContent = [
      "#scene-compass{position:fixed;right:24px;top:24px;z-index:7;width:74px;height:74px;",
      "border-radius:50%;background:rgba(247,246,242,.82);border:1px solid rgba(93,97,82,.28);",
      "box-shadow:0 8px 24px rgba(40,50,35,.12);pointer-events:none;backdrop-filter:blur(4px)}",
      "#scene-compass .dial{position:absolute;inset:0;will-change:transform}",
      "#scene-compass span{position:absolute;font:600 10px/1 'Segoe UI',system-ui,sans-serif;color:#4c5346}",
      "#scene-compass .n{left:50%;top:6px;transform:translateX(-50%);color:#b4533f}",
      "#scene-compass .e{right:8px;top:50%;transform:translateY(-50%)}",
      "#scene-compass .s{left:50%;bottom:6px;transform:translateX(-50%)}",
      "#scene-compass .w{left:8px;top:50%;transform:translateY(-50%)}",
      "#scene-compass .needle{position:absolute;left:50%;top:50%;width:2px;height:25px;",
      "transform:translate(-50%,-100%);transform-origin:bottom center;border-radius:2px;",
      "background:linear-gradient(#b4533f 0 58%,#7c8470 58% 100%)}",
      "@media(max-width:720px){#scene-compass{right:14px;top:14px;width:62px;height:62px}}",
    ].join("");
    document.head.appendChild(style);
  }
  const el = document.createElement("div");
  el.id = "scene-compass";
  el.innerHTML = '<div class="dial"><span class="n">N</span><span class="e">E</span>'
    + '<span class="s">S</span><span class="w">W</span><i class="needle"></i></div>';
  document.body.appendChild(el);
  compassDial = el.querySelector(".dial");
}

function updateCompass() {
  if (!compassDial) return;
  const north = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion.clone().invert());
  const angle = Math.atan2(north.x, north.y) * 180 / Math.PI;
  compassDial.style.transform = `rotate(${angle}deg)`;
}

function render() {
  controls.update();
  const clock = performance.now() * 0.001;
  if (ridePulse && rideCurve) {
    const delta = lastRideTime ? Math.min(0.1, clock - lastRideTime) : 0.016;
    if (rideAuto) {
      rideProgress += delta * 0.045;
      if (rideProgress > 1) rideProgress -= 1;
    }
    lastRideTime = clock;

    const targetPulseScale = ridePulseActive ? 2 : 1;
    ridePulseScale +=
      (targetPulseScale - ridePulseScale) * Math.min(1, delta * 8);
    ridePulse.scale.setScalar(ridePulseScale);
    if (rideProjectionPulse) {
      rideProjectionPulse.scale.setScalar(
        0.82 + (ridePulseScale - 1) * 0.58,
      );
    }
    if (rideMapProjectionPulse) {
      rideMapProjectionPulse.scale.setScalar(
        0.88 + (ridePulseScale - 1) * 0.62,
      );
    }
    if (routeSlider) {
      routeSlider.dataset.pulseScale = ridePulseScale.toFixed(3);
      routeSlider.dataset.autoMode = rideAuto ? "1" : "0";
    }

    updateRidePulse(rideProgress);
    if (rideAuto) {
      if (routeSlider) routeSlider.value = String(Math.round(rideProgress * 1000));
      if (routeSliderValue) {
        routeSliderValue.textContent = `${Math.round(rideProgress * 100)}%`;
      }
    }
  }
  updateCompass();
  updateProjectedLabel(peakLabel, peakPosition, peakMarker);
  if (locationMarker?.visible) {
    updateProjectedLabel(locationLabel, locationPosition, locationMarker, true);
  }
  renderer.render(scene, camera);
}

function updateProjectedLabel(element, localPosition, object, subpixel = false) {
  if (!element || !localPosition || !object) return;
  const scale = Number(exaggerationInput.value);
  const worldPosition = new THREE.Vector3(
    localPosition.x,
    localPosition.y * scale + (subpixel ? 85 : 20),
    localPosition.z,
  );
  const projected = worldPosition.project(camera);
  const visible = projected.z > -1 && projected.z < 1;
  element.style.display = visible ? "flex" : "none";
  if (!visible) return;
  const left = (projected.x * 0.5 + 0.5) * window.innerWidth;
  const top = (-projected.y * 0.5 + 0.5) * window.innerHeight;
  element.style.left = `${left.toFixed(1)}px`;
  element.style.top = `${top.toFixed(1)}px`;
}

function hideHint() {
  if (didInteract) return;
  didInteract = true;
  viewHint.classList.add("is-hidden");
}

function announce(message) {
  statusMessage.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    const city = CITY_DATA?.metadata;
    const scene = city?.scene;
    const plan = city?.buildingPlan;
    statusMessage.textContent = city
      ? city.artisticMode
        ? `${city.artisticLabel ?? "幻想城市"} · ${city.totalBuildings} 栋艺术建筑`
        : `${scene?.primary.label ?? city.settlementLabel} · ${plan?.modeLabel ?? "建筑层"} · ${city.totalBuildings} 栋`
      : "数据已预处理，网页端仅渲染轻量网格。";
  }, 5000);
}
