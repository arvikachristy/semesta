// @vitest-environment jsdom
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { createFlagBlock } from './jelly-flags/flag-block';
import { createGlassSet } from './glasses/glass-set';
import { bindPointerEvents } from './pointer';

const Events = {
  down: 'pointerdown',
  move: 'pointermove',
  up: 'pointerup',
  cancel: 'pointercancel',
  lost: 'lostpointercapture',
  blur: 'blur',
};
const PointerTypes = { mouse: 'mouse', touch: 'touch' };

describe('pointer gestures', () => {
  let canvas: HTMLCanvasElement;
  let glasses: ReturnType<typeof createGlassSet>;
  let camera: THREE.PerspectiveCamera;
  let cameraTarget: THREE.Vector3;
  let unbind: () => void;
  let glassPoint: THREE.Vector2;
  const captures = new Set<number>();
  const send = (type: string, x: number, y: number, options: PointerEventInit = {}) =>
    canvas.dispatchEvent(
      new PointerEvent(type, {
        clientX: x,
        clientY: y,
        pointerId: 1,
        isPrimary: true,
        pointerType: PointerTypes.mouse,
        button: 0,
        ...options,
      }),
    );
  const bind = (blocks: ReturnType<typeof createFlagBlock>[] = []) => {
    unbind = bindPointerEvents({ canvas, camera, cameraTarget, blocks, glasses }).unbind;
  };

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.append(canvas);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 1000, 800));
    Object.defineProperties(canvas, { clientWidth: { value: 1000 }, clientHeight: { value: 800 } });
    canvas.setPointerCapture = (id) => {
      captures.add(id);
    };
    canvas.hasPointerCapture = (id) => captures.has(id);
    canvas.releasePointerCapture = (id) => {
      captures.delete(id);
    };
    glasses = createGlassSet();
    cameraTarget = new THREE.Vector3(0, 1.5, 0);
    camera = new THREE.PerspectiveCamera(45, 1.25, 0.1, 200);
    camera.position.set(0, 8, 16);
    camera.lookAt(cameraTarget);
    camera.updateMatrixWorld();
    const projected = glasses.object.children[0].position.clone();
    projected.y = 1.5;
    projected.project(camera);
    glassPoint = new THREE.Vector2((projected.x + 1) * 500, (1 - projected.y) * 400);
    bind();
  });
  afterEach(() => {
    unbind();
    glasses.dispose();
    canvas.remove();
    captures.clear();
    vi.restoreAllMocks();
  });

  it.each(Object.values(PointerTypes))(
    'rotates both ways with %s, stays grounded, and stops on release',
    (pointerType) => {
      const { x, y } = glassPoint;
      const target = cameraTarget.clone();
      send(Events.down, x, y, { pointerType });
      send(Events.move, x + 100, y + 50, { pointerType });
      expect(glasses.object.rotation.y).toBeCloseTo(Math.PI / 5);
      send(Events.move, x - 100, y - 50, { pointerType });
      expect(glasses.object.rotation.y).toBeCloseTo(-Math.PI / 5);
      expect(cameraTarget.equals(target)).toBe(true);
      expect(glasses.object.position.toArray()).toEqual([0, 0, 0]);
      expect(glasses.object.rotation.x).toBe(0);
      expect(glasses.object.rotation.z).toBe(0);
      send(Events.up, x - 100, y - 50, { pointerType });
      send(Events.move, x + 200, y, { pointerType });
      expect(glasses.object.rotation.y).toBeCloseTo(-Math.PI / 5);
      expect(captures.size).toBe(0);
    },
  );

  it.each([Events.cancel, Events.lost, Events.blur])('ends rotation on %s', (eventName) => {
    const { x, y } = glassPoint;
    send(Events.down, x, y);
    send(Events.move, x + 50, y);
    const angle = glasses.object.rotation.y;
    if (eventName === Events.blur) {
      window.dispatchEvent(new Event(eventName));
    } else {
      send(eventName, x + 50, y);
    }
    send(Events.move, x + 150, y);
    expect(glasses.object.rotation.y).toBe(angle);
    expect(captures.size).toBe(0);
  });

  it('ignores secondary buttons and competing pointers', () => {
    const { x, y } = glassPoint;
    send(Events.down, x, y, { button: 2 });
    send(Events.move, x + 50, y);
    expect(glasses.object.rotation.y).toBe(0);
    send(Events.down, x, y);
    send(Events.move, x + 100, y, { pointerId: 2 });
    send(Events.move, x + 100, y, { isPrimary: false });
    send(Events.up, x, y, { pointerId: 2 });
    expect(glasses.object.rotation.y).toBe(0);
    send(Events.move, x + 50, y);
    expect(glasses.object.rotation.y).toBeGreaterThan(0);
  });

  it('keeps background panning separate from glass rotation', () => {
    const before = cameraTarget.clone();
    send(Events.down, 10, 10);
    send(Events.move, 100, 60);
    expect(cameraTarget.x).toBeLessThan(before.x);
    expect(cameraTarget.z).toBeLessThan(before.z);
    expect(glasses.object.rotation.y).toBe(0);
  });

  it('prioritises flag grabbing when a flag overlaps a glass', () => {
    unbind();
    const object = new THREE.Group();
    object.position.copy(glasses.object.children[0].position);
    object.position.y = 1.5;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    object.add(mesh);
    const block: ReturnType<typeof createFlagBlock> = {
      object,
      beginGrab: vi.fn(),
      moveGrab: vi.fn(),
      endGrab: vi.fn(),
      setBounds: vi.fn(),
      setCountry: vi.fn(async () => {}),
      update: vi.fn(),
      dispose: vi.fn(),
    };
    bind([block]);
    const { x, y } = glassPoint;
    send(Events.down, x, y);
    send(Events.move, x + 50, y);
    send(Events.up, x + 50, y);
    expect(block.beginGrab).toHaveBeenCalledOnce();
    expect(block.moveGrab).toHaveBeenCalledOnce();
    expect(block.endGrab).toHaveBeenCalledWith(true);
    expect(glasses.object.rotation.y).toBe(0);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  it('releases capture and removes listeners on cleanup', () => {
    const { x, y } = glassPoint;
    send(Events.down, x, y);
    unbind();
    expect(captures.size).toBe(0);
    send(Events.down, x, y);
    send(Events.move, x + 100, y);
    expect(glasses.object.rotation.y).toBe(0);
  });
});
