import * as THREE from "three";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.terrain = null;
    this.trees = [];
    this.obstacles = [];

    this.init();
  }

  init() {
    this.createTerrain();
    this.createTrees();
    this.createObstacles();
    this.createSkybox();
  }

  createTerrain() {
    // Create a snowy ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);

    // Add some height variation for a more interesting terrain
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Add some random height variation
      vertices[i + 2] =
        Math.sin(vertices[i] * 0.1) * Math.cos(vertices[i + 1] * 0.1) * 2;
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);

    // Add some texture variation with patches of snow
    this.addSnowPatches();
  }

  addSnowPatches() {
    // Create random snow mounds/patches
    for (let i = 0; i < 20; i++) {
      const patchGeometry = new THREE.SphereGeometry(
        Math.random() * 2 + 1,
        8,
        6,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );

      const patchMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const patch = new THREE.Mesh(patchGeometry, patchMaterial);

      patch.position.set(
        (Math.random() - 0.5) * 180,
        0,
        (Math.random() - 0.5) * 180
      );

      patch.rotation.y = Math.random() * Math.PI * 2;
      patch.receiveShadow = true;
      this.scene.add(patch);
    }
  }

  createTrees() {
    // Create simple pine trees scattered around
    for (let i = 0; i < 30; i++) {
      const tree = this.createTree();

      // Random position
      tree.position.set(
        (Math.random() - 0.5) * 180,
        0,
        (Math.random() - 0.5) * 180
      );

      this.trees.push(tree);
      this.scene.add(tree);
    }
  }

  createTree() {
    const treeGroup = new THREE.Group();

    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Tree foliage (pine cone shape)
    const foliageGeometry = new THREE.ConeGeometry(2, 4, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x0d5016 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 4.5;
    foliage.castShadow = true;
    treeGroup.add(foliage);

    // Lower foliage layer
    const foliage2 = new THREE.Mesh(foliageGeometry.clone(), foliageMaterial);
    foliage2.position.y = 3;
    foliage2.scale.set(1.2, 0.8, 1.2);
    foliage2.castShadow = true;
    treeGroup.add(foliage2);

    // Snow on tree
    const snowGeometry = new THREE.ConeGeometry(2.1, 0.2, 8);
    const snowMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const snow = new THREE.Mesh(snowGeometry, snowMaterial);
    snow.position.y = 6.4;
    treeGroup.add(snow);

    return treeGroup;
  }

  createObstacles() {
    // Create some rocks and barriers
    for (let i = 0; i < 15; i++) {
      const obstacle = this.createRock();

      obstacle.position.set(
        (Math.random() - 0.5) * 160,
        0,
        (Math.random() - 0.5) * 160
      );

      this.obstacles.push(obstacle);
      this.scene.add(obstacle);
    }

    // Create some snow walls/barriers
    for (let i = 0; i < 8; i++) {
      const wall = this.createSnowWall();

      wall.position.set(
        (Math.random() - 0.5) * 120,
        0,
        (Math.random() - 0.5) * 120
      );

      wall.rotation.y = Math.random() * Math.PI * 2;
      this.obstacles.push(wall);
      this.scene.add(wall);
    }
  }

  createRock() {
    const rockGeometry = new THREE.DodecahedronGeometry(
      Math.random() * 1 + 0.5
    );
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);

    rock.position.y = rock.geometry.parameters.radius;
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    rock.castShadow = true;
    rock.receiveShadow = true;

    return rock;
  }

  createSnowWall() {
    const wallGroup = new THREE.Group();

    // Main wall
    const wallGeometry = new THREE.BoxGeometry(6, 2, 0.5);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf8f8ff });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 1;
    wall.castShadow = true;
    wall.receiveShadow = true;
    wallGroup.add(wall);

    // Snow cap on top
    const capGeometry = new THREE.BoxGeometry(6.2, 0.3, 0.8);
    const cap = new THREE.Mesh(capGeometry, wallMaterial);
    cap.position.y = 2.15;
    wallGroup.add(cap);

    return wallGroup;
  }

  createSkybox() {
    // Create a simple gradient sky dome
    const skyGeometry = new THREE.SphereGeometry(
      500,
      32,
      15,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8,
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);

    // Add some clouds
    this.createClouds();
  }

  createClouds() {
    for (let i = 0; i < 12; i++) {
      const cloud = this.createCloud();

      cloud.position.set(
        (Math.random() - 0.5) * 400,
        Math.random() * 30 + 20,
        (Math.random() - 0.5) * 400
      );

      this.scene.add(cloud);
    }
  }

  createCloud() {
    const cloudGroup = new THREE.Group();
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
    });

    // Create cloud using multiple spheres
    for (let i = 0; i < 5; i++) {
      const sphereGeometry = new THREE.SphereGeometry(
        Math.random() * 3 + 2,
        8,
        6
      );
      const sphere = new THREE.Mesh(sphereGeometry, cloudMaterial);

      sphere.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 8
      );

      cloudGroup.add(sphere);
    }

    return cloudGroup;
  }

  update(deltaTime) {
    // Animate clouds slowly
    this.scene.children.forEach((child) => {
      if (
        child.type === "Group" &&
        child.children.length > 0 &&
        child.children[0].material &&
        child.children[0].material.opacity === 0.7
      ) {
        child.rotation.y += deltaTime * 0.01;
        child.position.x += deltaTime * 0.5;

        // Wrap around
        if (child.position.x > 200) {
          child.position.x = -200;
        }
      }
    });
  }
}
