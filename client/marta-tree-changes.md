```
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
    // Create a variety of tree types scattered around
    for (let i = 0; i < 35; i++) {
      let tree;
      const treeTypeRandom = Math.random();
      
      // Create different tree types for variety
      if (treeTypeRandom < 0.6) {
        tree = this.createTree(); // Enhanced pine tree
      } else if (treeTypeRandom < 0.8) {
        tree = this.createFirTree(); // Tall, narrow fir
      } else {
        tree = this.createSpruceTree(); // Wide, full spruce
      }

      // Random position with some clustering for natural forest look
      const clusterCenter = {
        x: (Math.random() - 0.5) * 160,
        z: (Math.random() - 0.5) * 160
      };
      
      // Add some clustering by positioning trees near cluster centers sometimes
      const useCluster = Math.random() > 0.7;
      if (useCluster && this.trees.length > 0) {
        const existingTree = this.trees[Math.floor(Math.random() * this.trees.length)];
        tree.position.set(
          existingTree.position.x + (Math.random() - 0.5) * 15,
          0,
          existingTree.position.z + (Math.random() - 0.5) * 15
        );
      } else {
        tree.position.set(
          (Math.random() - 0.5) * 180,
          0,
          (Math.random() - 0.5) * 180
        );
      }

      // Add some rotation for natural variation
      tree.rotation.y = Math.random() * Math.PI * 2;

      this.trees.push(tree);
      this.scene.add(tree);
    }
  }

  createFirTree() {
    const treeGroup = new THREE.Group();
    
    // Taller, narrower tree
    const heightVariation = 1.0 + Math.random() * 0.8; // 1.0 to 1.8
    const widthVariation = 0.6 + Math.random() * 0.3; // Narrower than regular trees

    // Fir trunk - taller and thinner with organic shape
    const trunkHeight = 4 * heightVariation;
    const trunkGeometry = new THREE.CylinderGeometry(
      0.2 + Math.random() * 0.05,
      0.3 + Math.random() * 0.1,
      trunkHeight, 
      16, // more segments
      6   // height segments
    );
    
    // Add organic trunk deformation
    const trunkVertices = trunkGeometry.attributes.position.array;
    for (let i = 0; i < trunkVertices.length; i += 3) {
      const x = trunkVertices[i];
      const z = trunkVertices[i + 2];
      const y = trunkVertices[i + 1];
      const distance = Math.sqrt(x * x + z * z);
      
      const bark1 = Math.sin(y * 5 + x * 3) * 0.015;
      const bark2 = Math.cos(y * 7 + z * 4) * 0.01;
      const totalNoise = (bark1 + bark2) * distance;
      
      trunkVertices[i] += totalNoise;
      trunkVertices[i + 2] += totalNoise;
    }
    trunkGeometry.attributes.position.needsUpdate = true;
    trunkGeometry.computeVertexNormals();
    
    const barkColors = [0x3d2f1f, 0x4a3c28, 0x5d4e3a];
    const trunkMaterial = new THREE.MeshLambertMaterial({ 
      color: barkColors[Math.floor(Math.random() * barkColors.length)]
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Fir foliage - more organic clusters instead of geometric cones
    const darkGreenShades = [
      0x0f4c2c, // Very dark forest green
      0x1e5631, // Deep green
      0x2d5a3d, // Dark green
      0x0d3b21, // Forest green
      0x164a28  // Pine green
    ];

    // Create organic foliage clusters for fir tree
    const numClusters = 12 + Math.floor(Math.random() * 8);
    for (let cluster = 0; cluster < numClusters; cluster++) {
      const heightRatio = cluster / numClusters;
      const clusterHeight = trunkHeight + 0.3 + (heightRatio * 4 * heightVariation);
      
      // Very narrow profile for fir
      const maxRadius = (1.2 - heightRatio * 0.9) * widthVariation;
      const clusterRadius = maxRadius * (0.6 + Math.random() * 0.4);
      
      // Position clusters in a spiral pattern for natural look
      const angle = (cluster * 2.4) + Math.random() * 1.2;
      const radiusOffset = Math.random() * maxRadius * 0.3;
      
      const clusterX = Math.cos(angle) * radiusOffset;
      const clusterZ = Math.sin(angle) * radiusOffset;
      
      // Create elongated cluster for fir needle appearance
      const foliageGeometry = new THREE.SphereGeometry(clusterRadius, 10, 6);
      
      // Deform to be more needle-like and droopy
      const vertices = foliageGeometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        
        // Make clusters more elongated and droopy
        const noise = Math.sin(x * 4) * Math.cos(z * 4) * 0.2;
        vertices[i + 1] *= 0.6; // Flatten vertically
        vertices[i] += noise;
        vertices[i + 2] += noise;
        
        // Add droop effect
        if (y < 0) {
          vertices[i + 1] *= 1.3; // Extend downward
        }
      }
      foliageGeometry.attributes.position.needsUpdate = true;
      foliageGeometry.computeVertexNormals();
      
      const colorIndex = Math.floor(Math.random() * darkGreenShades.length);
      const foliageMaterial = new THREE.MeshLambertMaterial({ 
        color: darkGreenShades[colorIndex]
      });
      
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(clusterX, clusterHeight, clusterZ);
      foliage.rotation.set(
        Math.random() * 0.3,
        Math.random() * Math.PI * 2,
        Math.random() * 0.3
      );
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      treeGroup.add(foliage);
    }

    this.addRealisticSnow(treeGroup, numClusters, trunkHeight, widthVariation);
    return treeGroup;
  }

  createSpruceTree() {
    const treeGroup = new THREE.Group();
    
    // Wider, fuller tree
    const heightVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const widthVariation = 1.2 + Math.random() * 0.4; // Wider than regular trees

    // Spruce trunk - shorter and thicker with organic deformation
    const trunkHeight = 2.5 * heightVariation;
    const trunkGeometry = new THREE.CylinderGeometry(
      0.35 + Math.random() * 0.1,
      0.5 + Math.random() * 0.15,
      trunkHeight, 
      16, // more segments
      6   // height segments
    );
    
    // Add organic trunk shape
    const trunkVertices = trunkGeometry.attributes.position.array;
    for (let i = 0; i < trunkVertices.length; i += 3) {
      const x = trunkVertices[i];
      const z = trunkVertices[i + 2];
      const y = trunkVertices[i + 1];
      const distance = Math.sqrt(x * x + z * z);
      
      const bark1 = Math.sin(y * 3 + x * 2) * 0.025;
      const bark2 = Math.cos(y * 6 + z * 3) * 0.02;
      const totalNoise = (bark1 + bark2) * distance;
      
      trunkVertices[i] += totalNoise;
      trunkVertices[i + 2] += totalNoise;
    }
    trunkGeometry.attributes.position.needsUpdate = true;
    trunkGeometry.computeVertexNormals();
    
    const barkColors = [0x4a3c28, 0x6b5b4f, 0x8b7355];
    const trunkMaterial = new THREE.MeshLambertMaterial({ 
      color: barkColors[Math.floor(Math.random() * barkColors.length)]
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Spruce foliage - fuller, more organic clusters
    const lightGreenShades = [
      0x228b22, // Forest green
      0x32cd32, // Lime green
      0x2e8b57, // Sea green
      0x87a96b, // Sage green
      0x8fbc8f, // Dark sea green
      0x6b8e23, // Olive drab
      0x9acd32  // Yellow green
    ];

    // Create full, bushy foliage with many organic clusters
    const numClusters = 16 + Math.floor(Math.random() * 8);
    for (let cluster = 0; cluster < numClusters; cluster++) {
      const heightRatio = cluster / numClusters;
      const clusterHeight = trunkHeight + 0.4 + (heightRatio * 2.5 * heightVariation);
      
      // Wide profile for spruce
      const maxRadius = (2.5 - heightRatio * 1.2) * widthVariation;
      const clusterRadius = maxRadius * (0.7 + Math.random() * 0.5);
      
      // Distribute clusters more randomly for fuller look
      const angle = Math.random() * Math.PI * 2;
      const radiusOffset = Math.random() * maxRadius * 0.6;
      
      const clusterX = Math.cos(angle) * radiusOffset;
      const clusterZ = Math.sin(angle) * radiusOffset;
      
      // Create full, rounded clusters for spruce
      const foliageGeometry = new THREE.SphereGeometry(clusterRadius, 12, 8);
      
      // Add organic variation but keep it fuller
      const vertices = foliageGeometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        
        // Gentle organic variation
        const noise1 = Math.sin(x * 2.5) * Math.cos(y * 3) * Math.sin(z * 2.5) * 0.2;
        const noise2 = Math.cos(x * 5 + y * 4) * 0.1;
        
        const scale = 1 + noise1 + noise2;
        vertices[i] *= scale;
        vertices[i + 1] *= scale * 0.9; // Slightly flatten
        vertices[i + 2] *= scale;
      }
      foliageGeometry.attributes.position.needsUpdate = true;
      foliageGeometry.computeVertexNormals();
      
      const colorIndex = Math.floor(Math.random() * lightGreenShades.length);
      const foliageMaterial = new THREE.MeshLambertMaterial({ 
        color: lightGreenShades[colorIndex]
      });
      
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(clusterX, clusterHeight, clusterZ);
      
      // Add natural rotation and scale variation
      foliage.rotation.set(
        Math.random() * 0.4 - 0.2,
        Math.random() * Math.PI * 2,
        Math.random() * 0.4 - 0.2
      );
      
      const scaleVariation = 0.8 + Math.random() * 0.4;
      foliage.scale.set(scaleVariation, scaleVariation, scaleVariation);
      
      // Add slight droop to lower branches for realism
      if (heightRatio < 0.4) {
        foliage.rotation.x += Math.random() * 0.3;
      }
      
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      treeGroup.add(foliage);
    }

    this.addRealisticSnow(treeGroup, numClusters, trunkHeight, widthVariation);
    return treeGroup;
  }

  createTree() {
    const treeGroup = new THREE.Group();
    
    // Randomization factors for tree variety
    const heightVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
    const widthVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

    // Enhanced tree trunk with natural organic shape
    const trunkHeight = 3 * heightVariation;
    const trunkGeometry = new THREE.CylinderGeometry(
      0.25 + Math.random() * 0.1, // top radius variation
      0.35 + Math.random() * 0.15, // bottom radius variation
      trunkHeight, 
      16, // more segments for smoother curves
      8   // height segments for better deformation
    );
    
    // Create more organic trunk shape with multiple noise functions
    const trunkVertices = trunkGeometry.attributes.position.array;
    for (let i = 0; i < trunkVertices.length; i += 3) {
      const x = trunkVertices[i];
      const z = trunkVertices[i + 2];
      const y = trunkVertices[i + 1];
      const distance = Math.sqrt(x * x + z * z);
      
      // Multiple layers of noise for more realistic bark texture
      const bark1 = Math.sin(y * 4 + x * 2) * 0.02;
      const bark2 = Math.cos(y * 8 + z * 3) * 0.015;
      const bark3 = Math.sin(y * 2 + x * z) * 0.01;
      const growthPattern = Math.sin(Math.atan2(z, x) * 3 + y * 0.5) * 0.025;
      
      const totalNoise = (bark1 + bark2 + bark3 + growthPattern) * distance;
      trunkVertices[i] += totalNoise;
      trunkVertices[i + 2] += totalNoise;
    }
    trunkGeometry.attributes.position.needsUpdate = true;
    trunkGeometry.computeVertexNormals();

    // Enhanced bark material with realistic brown variations
    const barkColors = [0x4a3c28, 0x5d4e3a, 0x6b5b4f, 0x8b7355, 0x3d2f1f];
    const trunkMaterial = new THREE.MeshLambertMaterial({ 
      color: barkColors[Math.floor(Math.random() * barkColors.length)]
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Create more realistic foliage using spherical shapes instead of cones
    const greenShades = [
      0x0f5132, // Dark forest green
      0x228b22, // Forest green  
      0x2e8b57, // Sea green
      0x006400, // Dark green
      0x355e3b, // Hunter green
      0x4f7942, // Fern green
      0x87a96b, // Sage green
      0x556b2f  // Dark olive green
    ];

    // Create organic foliage clusters instead of geometric layers
    const numClusters = 8 + Math.floor(Math.random() * 6); // 8-14 clusters
    
    for (let cluster = 0; cluster < numClusters; cluster++) {
      // Position clusters in a natural pine tree shape
      const heightRatio = cluster / numClusters;
      const clusterHeight = trunkHeight + 0.5 + (heightRatio * 3.5 * heightVariation);
      
      // Radius gets smaller towards the top
      const maxRadius = (2.2 - heightRatio * 1.5) * widthVariation;
      const clusterRadius = maxRadius * (0.7 + Math.random() * 0.6);
      
      // Random position around the tree for natural clustering
      const angle = Math.random() * Math.PI * 2;
      const radiusOffset = Math.random() * maxRadius * 0.4;
      
      const clusterX = Math.cos(angle) * radiusOffset;
      const clusterZ = Math.sin(angle) * radiusOffset;
      
      // Create organic foliage cluster using deformed sphere
      const foliageGeometry = new THREE.SphereGeometry(
        clusterRadius,
        12, // phi segments
        8   // theta segments
      );
      
      // Deform sphere to look more like natural foliage
      const vertices = foliageGeometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        const radius = Math.sqrt(x * x + y * y + z * z);
        
        // Create irregular, organic surface
        const noise1 = Math.sin(x * 3) * Math.cos(y * 4) * Math.sin(z * 3.5) * 0.3;
        const noise2 = Math.sin(x * 8 + y * 6) * 0.15;
        const noise3 = Math.cos(y * 5 + z * 4) * 0.2;
        const totalNoise = noise1 + noise2 + noise3;
        
        // Make it more flattened (less round) and irregular
        const flatteningFactor = Math.abs(y) / radius;
        const scale = 1 + totalNoise - flatteningFactor * 0.3;
        
        vertices[i] *= scale;
        vertices[i + 1] *= scale * 0.8; // Flatten vertically
        vertices[i + 2] *= scale;
      }
      
      foliageGeometry.attributes.position.needsUpdate = true;
      foliageGeometry.computeVertexNormals();

      // Choose natural green color with some variation
      const colorIndex = Math.floor(Math.random() * greenShades.length);
      const foliageMaterial = new THREE.MeshLambertMaterial({ 
        color: greenShades[colorIndex]
      });
      
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(clusterX, clusterHeight, clusterZ);
      
      // Add natural rotation and slight scale variation
      foliage.rotation.set(
        Math.random() * 0.4 - 0.2,
        Math.random() * Math.PI * 2,
        Math.random() * 0.4 - 0.2
      );
      
      const scaleVariation = 0.8 + Math.random() * 0.4;
      foliage.scale.set(scaleVariation, scaleVariation * 0.9, scaleVariation);
      
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      treeGroup.add(foliage);
    }

    // Add some needle-like details for pine tree realism
    this.addPineNeedleDetails(treeGroup, trunkHeight, heightVariation, greenShades);

    // Enhanced snow accumulation based on tree structure
    this.addRealisticSnow(treeGroup, numClusters, trunkHeight, widthVariation);

    // Add some small branch details
    this.addBranchDetails(treeGroup, trunkHeight, heightVariation);

    return treeGroup;
  }

  addPineNeedleDetails(treeGroup, trunkHeight, heightVariation, greenShades) {
    // Add small needle-like clusters for realism
    const numNeedleClusters = 15 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numNeedleClusters; i++) {
      const needleHeight = trunkHeight + Math.random() * 3 * heightVariation;
      const angle = Math.random() * Math.PI * 2;
      const radius = (Math.random() * 1.5 + 0.5) * (1 - (needleHeight - trunkHeight) / (3 * heightVariation));
      
      // Create small elongated shapes for needle clusters
      const needleGeometry = new THREE.CylinderGeometry(
        0.02,
        0.05,
        0.2 + Math.random() * 0.15,
        4
      );
      
      const colorIndex = Math.floor(Math.random() * greenShades.length);
      const needleMaterial = new THREE.MeshLambertMaterial({ 
        color: greenShades[colorIndex],
        transparent: true,
        opacity: 0.8
      });
      
      const needle = new THREE.Mesh(needleGeometry, needleMaterial);
      needle.position.set(
        Math.cos(angle) * radius,
        needleHeight,
        Math.sin(angle) * radius
      );
      
      // Orient needles to point outward and slightly downward
      needle.rotation.z = Math.PI / 3 + Math.random() * Math.PI / 6;
      needle.rotation.y = angle;
      needle.rotation.x = Math.random() * 0.3;
      
      treeGroup.add(needle);
    }
  }

  addSecondaryBranches(treeGroup, baseHeight, radius, greenShades) {
    const numBranches = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numBranches; i++) {
      const angle = (Math.PI * 2 * i) / numBranches + Math.random() * 0.8;
      const branchRadius = 0.2 + Math.random() * 0.15;
      const branchLength = 0.5 + Math.random() * 0.4;
      
      // Create organic branch shape using deformed sphere
      const branchGeometry = new THREE.SphereGeometry(branchRadius, 8, 6);
      
      // Deform to make it branch-like
      const vertices = branchGeometry.attributes.position.array;
      for (let j = 0; j < vertices.length; j += 3) {
        const x = vertices[j];
        const y = vertices[j + 1];
        const z = vertices[j + 2];
        
        // Stretch along one axis to make it branch-like
        vertices[j + 1] *= 2.5; // Stretch vertically
        
        // Add some organic variation
        const noise = Math.sin(x * 8 + y * 6) * 0.1;
        vertices[j] += noise;
        vertices[j + 2] += noise;
      }
      branchGeometry.attributes.position.needsUpdate = true;
      branchGeometry.computeVertexNormals();
      
      const colorIndex = Math.floor(Math.random() * greenShades.length);
      const branchMaterial = new THREE.MeshLambertMaterial({ 
        color: greenShades[colorIndex],
        transparent: true,
        opacity: 0.9
      });
      
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      branch.position.set(
        Math.cos(angle) * radius * 0.7,
        baseHeight - 0.3 + Math.random() * 0.6,
        Math.sin(angle) * radius * 0.7
      );
      
      // Orient branch outward and slightly downward
      branch.rotation.z = Math.PI / 4 + Math.random() * Math.PI / 8;
      branch.rotation.y = angle;
      branch.rotation.x = Math.random() * 0.3;
      
      branch.castShadow = true;
      treeGroup.add(branch);
    }
  }

  addRealisticSnow(treeGroup, numLayers, trunkHeight, widthVariation) {
    // Snow accumulates differently on different parts of the tree
    const snowAmount = 0.3 + Math.random() * 0.4; // Varying snow accumulation
    
    for (let layer = 0; layer < numLayers; layer++) {
      if (Math.random() < snowAmount) {
        const layerHeight = trunkHeight + (layer * 0.8) + 0.5;
        const layerRadius = (2.5 - layer * 0.3) * widthVariation;
        
        // Snow cap on foliage layers
        const snowGeometry = new THREE.ConeGeometry(
          layerRadius + 0.1, 
          0.1 + Math.random() * 0.1, 
          8
        );
        const snowMaterial = new THREE.MeshLambertMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.9
        });
        const snow = new THREE.Mesh(snowGeometry, snowMaterial);
        snow.position.y = layerHeight + 0.6;
        snow.rotation.y = Math.random() * Math.PI * 2;
        treeGroup.add(snow);
      }
    }

    // Snow on trunk (bark showing through)
    if (Math.random() > 0.4) {
      const trunkSnowGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8);
      const trunkSnowMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xf8f8ff,
        transparent: true,
        opacity: 0.8
      });
      const trunkSnow = new THREE.Mesh(trunkSnowGeometry, trunkSnowMaterial);
      trunkSnow.position.y = 0.2 + Math.random() * 0.3;
      treeGroup.add(trunkSnow);
    }
  }

  addBranchDetails(treeGroup, trunkHeight, heightVariation) {
    // Add small protruding branches on the trunk
    const numTrunkBranches = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numTrunkBranches; i++) {
      const branchGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.3 + Math.random() * 0.2, 4);
      const branchMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2f1f });
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      const angle = Math.random() * Math.PI * 2;
      const height = Math.random() * trunkHeight * 0.8;
      const distance = 0.35 + Math.random() * 0.1;
      
      branch.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      
      // Angle the branch outward and slightly upward
      branch.rotation.z = Math.PI / 4 + Math.random() * Math.PI / 6;
      branch.rotation.y = angle;
      
      branch.castShadow = true;
      treeGroup.add(branch);
    }
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

    // Animate trees with wind effect
    const windTime = Date.now() * 0.001;
    this.trees.forEach((tree, index) => {
      // Create subtle wind movement
      const windStrength = 0.05 + Math.sin(windTime * 0.3 + index * 0.1) * 0.03;
      const windDirection = Math.sin(windTime * 0.2 + index * 0.05) * 0.4;
      
      // Apply wind to foliage layers (skip trunk)
      tree.children.forEach((child, childIndex) => {
        if (child.geometry && child.geometry.type === 'ConeGeometry') {
          // Foliage layers sway in the wind
          const heightFactor = child.position.y / 8; // Higher layers move more
          const layerWind = windStrength * heightFactor;
          
          child.rotation.z = windDirection * layerWind;
          child.rotation.x = Math.sin(windTime * 0.4 + childIndex * 0.2) * layerWind * 0.5;
          
          // Add subtle scale breathing effect
          const breathe = 1 + Math.sin(windTime * 0.6 + index * 0.3) * 0.02;
          child.scale.x = breathe;
          child.scale.z = breathe;
        }
      });

      // Very subtle tree base movement
      const treeMovement = Math.sin(windTime * 0.15 + index * 0.1) * 0.01;
      tree.rotation.z = treeMovement;
      tree.rotation.x = Math.cos(windTime * 0.1 + index * 0.15) * treeMovement * 0.5;
    });
  }
}
```