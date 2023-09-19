import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';

// Helper function to generate a random number within a specified range
const randomRangeNum = (min, max) => Math.random() * (max - min) + min;

// Elements for displaying points, game over message, and restart button
const pointsUI = document.querySelector('#points');
const gameOverText = document.querySelector('#gameOver');
const restartBtnContainer = document.querySelector('#restartBtnContainer');

// Initialize points and game over state
let points = 0;
let gameOver = false;

// Set up the Three.js scene
const scene = new THREE.Scene();

// Set up the Cannon.js world with gravity
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4.5);

// Set up the renderer and append it to the DOM
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up controls for camera movement
const controls = new OrbitControls(camera, renderer.domElement);

// Function to move obstacles
const moveObstacles = (obstacles, speed, maxX, minX, maxZ, minZ) => {
  obstacles.forEach((obstacle) => {
    obstacle.body.position.z += speed;
    if (obstacle.body.position.z > camera.position.z) {
      obstacle.body.position.x = randomRangeNum(maxX, minX);
      obstacle.body.position.z = randomRangeNum(maxZ, minZ);
    }
    obstacle.mesh.position.copy(obstacle.body.position);
    obstacle.mesh.quaternion.copy(obstacle.body.quaternion);
  });
};

// Create the ground (platform)
const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(15, 0.5, 15)),
});
groundBody.position.y = -1;
world.addBody(groundBody);

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(10, 1, 30),
  // new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  new THREE.MeshBasicMaterial({ color: 0x888888 })
);
ground.position.y = -1;
scene.add(ground);

// Create the player's character
const playerBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)),
  fixedRotation: true,
});
world.addBody(playerBody);

//!______________
// Create the car body with adjusted geometry
const carBodyGeometry = new THREE.BoxGeometry(0.5, 0.2, 1); // Swap dimensions to make it face the right direction
const carBodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);

// Create the car roof
const carRoofGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.7); // Adjust dimensions accordingly
const carRoofMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const carRoof = new THREE.Mesh(carRoofGeometry, carRoofMaterial);
carRoof.position.set(0, 0.15, 0);

// Group the car body and roof
const player = new THREE.Group();
player.add(carBody);
player.add(carRoof);

// Create the wheels with adjusted positions and rotations
const wheelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 16);
const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

frontLeftWheel.position.set(-0.25, -0.15, 0.3);
frontRightWheel.position.set(0.25, -0.15, 0.3);
rearLeftWheel.position.set(-0.25, -0.15, -0.3);
rearRightWheel.position.set(0.25, -0.15, -0.3);

// Rotate the wheels to align with the car body
frontLeftWheel.rotation.z = Math.PI / 2;
frontRightWheel.rotation.z = Math.PI / 2;
rearLeftWheel.rotation.z = Math.PI / 2;
rearRightWheel.rotation.z = Math.PI / 2;

player.add(frontLeftWheel);
player.add(frontRightWheel);
player.add(rearLeftWheel);
player.add(rearRightWheel);

// Rotate the car to face the horizon (perpendicular to it)
player.rotation.y = Math.PI / 2; // 90 degrees rotation around the vertical axis

scene.add(player);

//!--------------- Powerup

// // Create powerup objects
// const multiplePowerup = [];

// for (let i = 0; i < 10; i++) {
//   const posX = randomRangeNum(8, -8);
//   const posZ = randomRangeNum(-5, -10);

//   const powerup = new THREE.Mesh(
//     new THREE.TorusGeometry(1, 0.4, 16, 50),
//     new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
//   );
//   powerup.scale.set(0.1, 0.1, 0.1);
//   powerup.position.set(posX, 0, posZ);
//   scene.add(powerup);

//   const powerupBody = new CANNON.Body({
//     shape: new CANNON.Sphere(0.2),
//   });
//   powerupBody.position.set(posX, 0, posZ);
//   world.addBody(powerupBody);

//   const powerupObject = {
//     mesh: powerup,
//     body: powerupBody,
//   };
//   multiplePowerup.push(powerupObject);
// }

// Create powerup objects with magnetic field appearance
const multiplePowerup = [];

for (let i = 0; i < 10; i++) {
  const posX = randomRangeNum(8, -8);
  const posZ = randomRangeNum(-5, -10);

  // Create the powerup body
  const powerupGeometry = new THREE.Group();

  // Sphere for the powerup core (inner sphere)
  const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFF00, // Yellow color for the core
    transparent: true,
    opacity: 0.8, // Increase opacity for better visibility
  });
  const coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);

  // Sphere for the magnetic field (outer sphere)
  const fieldGeometry = new THREE.SphereGeometry(1.0, 32, 32);
  const fieldMaterial = new THREE.MeshBasicMaterial({
    color: 0x00BFFF, // Light blue color for the field
    transparent: true,
    opacity: 0.2, // Decrease opacity to create a light membrane effect
  });
  const fieldSphere = new THREE.Mesh(fieldGeometry, fieldMaterial);

  // Position and add parts to the powerup
  coreSphere.position.set(0, 0, 0);
  fieldSphere.position.set(0, 0, 0);
  powerupGeometry.add(coreSphere);
  powerupGeometry.add(fieldSphere);

  powerupGeometry.scale.set(0.2, 0.2, 0.2);
  powerupGeometry.position.set(posX, 0, posZ);
  scene.add(powerupGeometry);

  const powerupBody = new CANNON.Body({
    shape: new CANNON.Sphere(0.4),
  });
  powerupBody.position.set(posX, 0, posZ);
  world.addBody(powerupBody);

  const powerupObject = {
    mesh: powerupGeometry,
    body: powerupBody,
  };
  multiplePowerup.push(powerupObject);
}

//!______________________________________________________________ Enemy
// // Create enemy characters
// const allEnemies = [];

// for (let i = 0; i < 3; i++) {
//   const posX = randomRangeNum(8, -8);
//   const posZ = randomRangeNum(-5, -10);

//   const enemy = new THREE.Mesh(
//     new THREE.BoxGeometry(5, 5, 5, 4),
//     new THREE.MeshBasicMaterial({ color: 0x0000FF })
//   );
//   enemy.scale.set(0.1, 0.1, 0.1);
//   enemy.position.set(posX, 0, posZ);
//   scene.add(enemy);

//   const enemyBody = new CANNON.Body({
//     shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5, 0.5)),
//   });
//   enemyBody.position.set(posX, 0, posZ);
//   world.addBody(enemyBody);

//   const enemyObject = {
//     mesh: enemy,
//     body: enemyBody,
//   };
//   allEnemies.push(enemyObject);
// }

// Create enemy characters with larger mine-like geometry
const allEnemies = [];

for (let i = 0; i < 3; i++) {
  const posX = randomRangeNum(8, -8);
  const posZ = randomRangeNum(-5, -10);

  // Create the mine body
  const mineGeometry = new THREE.Group();

  // Sphere for the top part (round)
  const topSphereGeometry = new THREE.SphereGeometry(0.8, 16, 16);
  const topSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 }); // Red color
  const topSphere = new THREE.Mesh(topSphereGeometry, topSphereMaterial);

  // Cylinder for the bottom part (cylindrical)
  const bottomCylinderGeometry = new THREE.CylinderGeometry(0.8, 1, 0.4, 16);
  const bottomCylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black color
  const bottomCylinder = new THREE.Mesh(bottomCylinderGeometry, bottomCylinderMaterial);

  // Position and add parts to the mine
  topSphere.position.set(0, 0.4, 0);
  bottomCylinder.position.set(0, 0, 0);
  mineGeometry.add(topSphere);
  mineGeometry.add(bottomCylinder);

  mineGeometry.scale.set(0.2, 0.2, 0.2);
  mineGeometry.position.set(posX, 0, posZ);
  scene.add(mineGeometry);

  const enemyBody = new CANNON.Body({
    shape: new CANNON.Sphere(0.8), // Approximate shape with a sphere for collisions
  });
  enemyBody.position.set(posX, 0, posZ);
  world.addBody(enemyBody);

  const enemyObject = {
    mesh: mineGeometry,
    body: enemyBody,
  };
  allEnemies.push(enemyObject);
}


//!___________________________________________________________________

// Event listener for player collisions with powerups and enemies
playerBody.addEventListener('collide', (e) => {
  multiplePowerup.forEach((powerup) => {
    if (e.body === powerup.body) {
      // Handle powerup collision and update points
      powerup.body.position.x = randomRangeNum(8, -8);
      powerup.body.position.z = randomRangeNum(-5, -10);
      powerup.mesh.position.copy(powerup.body.position);
      powerup.mesh.quaternion.copy(powerup.body.quaternion);
      points += 1;
      pointsUI.textContent = points.toString();
    }
  });

  allEnemies.forEach((el) => {
    if (e.body === el.body) {
      // Handle enemy collision (game over condition)
      gameOver = true;
      restartBtnContainer.innerHTML = `<button id="restartBtn">Restart</button>`;
      const btn = document.querySelector('#restartBtn');
      btn.addEventListener('click', () => {
        // Reset the game when the restart button is clicked
        restartGame();
      });
    }
  });
});

// Function to restart the game
function restartGame() {
  gameOver = false;
  points = 0;
  pointsUI.textContent = '0';
  gameOverText.textContent = '';
  restartBtnContainer.innerHTML = '';
  
  // Reset player position
  playerBody.position.set(0, 0, 0);

  // Remove enemies and powerups from the scene and Cannon.js world
  allEnemies.forEach((el) => {
    scene.remove(el.mesh);
    world.removeBody(el.body);
  });
  multiplePowerup.forEach((el) => {
    scene.remove(el.mesh);
    world.removeBody(el.body);
  });

  // Add new enemies and powerups
  for (let i = 0; i < 10; i++) {
    const posX = randomRangeNum(8, -8);
    const posZ = randomRangeNum(-5, -10);

    const powerup = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.4, 16, 50),
      new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
    );
    powerup.scale.set(0.1, 0.1, 0.1);
    powerup.position.set(posX, 0, posZ);
    scene.add(powerup);

    const powerupBody = new CANNON.Body({
      shape: new CANNON.Sphere(0.2),
    });
    powerupBody.position.set(posX, 0, posZ);
    world.addBody(powerupBody);

    const powerupObject = {
      mesh: powerup,
      body: powerupBody,
    };
    multiplePowerup.push(powerupObject);
  }

  for (let i = 0; i < 3; i++) {
    const posX = randomRangeNum(8, -8);
    const posZ = randomRangeNum(-5, -10);

    const enemy = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0x0000FF })
    );
    enemy.scale.set(0.1, 0.1, 0.1);
    enemy.position.set(posX, 0, posZ);
    scene.add(enemy);

    const enemyBody = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5, 0.5)),
    });
    enemyBody.position.set(posX, 0, posZ);
    world.addBody(enemyBody);

    const enemyObject = {
      mesh: enemy,
      body: enemyBody,
    };
    allEnemies.push(enemyObject);
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (!gameOver) {
    // Move powerups and enemies when the game is not over
    moveObstacles(multiplePowerup, 0.1, 8, -8, -5, -10);
    moveObstacles(allEnemies, 0.15, 8, -8, -5, -10);
  }

  // Handle game over state
  if (gameOver) {
    pointsUI.textContent = `${points}`;
    gameOverText.textContent = `GAME OVER`;
  }

  // Update controls, physics, and rendering
  controls.update();
  world.fixedStep(); // Use fixed step for Cannon.js physics
  player.position.copy(playerBody.position);
  player.quaternion.copy(playerBody.quaternion);
  renderer.render(scene, camera);
}

animate();

// Event listener for window resize to update camera aspect ratio
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Event listener for keyboard controls (movement)
window.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
    playerBody.position.x += 0.2;
  } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
    playerBody.position.x -= 0.2;
  } else if (e.key === 'r' || e.key === 'R') {
    // Restart the game when 'R' is pressed
    restartGame();
  } else if (e.key === ' ') {
    playerBody.position.y = 2;
  } else if (e.key === 'ArrowUp') {
    // Move the player forward
    playerBody.position.z -= 0.4; // Adjust the speed as needed
  } else if (e.key === 'ArrowDown') {
    // Move the player backward
    playerBody.position.z += 0.2; // Adjust the speed as needed
  }
});
