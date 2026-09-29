import * as THREE from 'three';

// The scene holds all objects and sets the clear colour behind the floor.
export const createScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f3c9c7');
  return scene;
};
