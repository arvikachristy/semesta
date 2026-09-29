import * as THREE from 'three';
import { flags } from './flags';
import type { IFlagDefinition, TCountryCode } from './flags';

const depth = 0.25;

const createFlagMesh = (definition: IFlagDefinition, texture: THREE.Texture) => {
  // The outline defines the solid's actual silhouette in world coordinates.
  const shape = new THREE.Shape();
  definition.outline.forEach(([u, v], index) => {
    const x = (u - 0.5) * definition.aspectRatio;
    const y = v - 0.5;

    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.translate(0, 0, -depth / 2);

  // ExtrudeGeometry assigns material 0 to the two caps and material 1 to the edges.
  // Map the cap UVs to the artwork; the shape clips the image to the solid's outline.
  const positions = geometry.getAttribute('position');
  const uvs = geometry.getAttribute('uv');
  const caps = geometry.groups.find((group) => group.materialIndex === 0);

  if (caps) {
    for (let index = caps.start; index < caps.start + caps.count; index += 1) {
      uvs.setXY(
        index,
        positions.getX(index) / definition.aspectRatio + 0.5,
        positions.getY(index) + 0.5,
      );
    }
    uvs.needsUpdate = true;
  }

  return new THREE.Mesh(geometry, [
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }),
    new THREE.MeshLambertMaterial({ color: definition.edgeColor }),
  ]);
};

const disposeFlagMesh = (mesh: ReturnType<typeof createFlagMesh>) => {
  mesh.geometry.dispose();
  mesh.material.forEach((material) => material.dispose());
};

export const createFlag = () => {
  // Keep this parent object stable so pointer handling survives a country change.
  const object = new THREE.Group();
  object.position.set(0, 0.5, 0);
  object.rotation.y = Math.PI / 8;

  const textures = new Map<TCountryCode, Promise<THREE.Texture>>();
  let mesh: ReturnType<typeof createFlagMesh> | null = null;
  let request = 0;
  let disposed = false;

  const loadTexture = (code: TCountryCode) => {
    const cached = textures.get(code);
    if (cached) {
      return cached;
    }

    const loading = (async () => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = flags[code].artwork;
      await image.decode();

      // Browsers can display SVGs directly, but WebGL needs raster pixels.
      const canvas = document.createElement('canvas');
      canvas.height = 512;
      canvas.width = Math.round(canvas.height * flags[code].aspectRatio);
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error(`Could not draw the ${flags[code].name} flag.`);
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    })().catch((error: unknown) => {
      textures.delete(code);
      throw error;
    });
    textures.set(code, loading);
    return loading;
  };

  const setCountry = async (code: TCountryCode) => {
    const nextRequest = ++request;
    let texture: THREE.Texture;
    try {
      texture = await loadTexture(code);
    } catch (error) {
      if (disposed || nextRequest !== request) {
        return;
      }
      throw error;
    }
    if (disposed || nextRequest !== request) {
      return;
    }

    const nextMesh = createFlagMesh(flags[code], texture);
    if (mesh) {
      object.remove(mesh);
      disposeFlagMesh(mesh);
    }
    mesh = nextMesh;
    object.add(nextMesh);
  };

  const dispose = () => {
    disposed = true;
    request += 1;
    if (mesh) {
      disposeFlagMesh(mesh);
    }
    textures.forEach((loading) => {
      void loading.then((texture) => texture.dispose()).catch(() => undefined);
    });
    object.clear();
  };

  return { object, setCountry, dispose };
};
