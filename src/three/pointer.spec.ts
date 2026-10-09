// @vitest-environment jsdom
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { createFlagBlock } from './jelly-flags/flag-block';
import { createGlassSet } from './glasses/glass-set';
import { bindPointerEvents } from './pointer';
import { createCameraPan } from './pan';

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
  const zoomBy = vi.fn();
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  const flushGesture = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(performance.now()));
  };
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
    unbind = bindPointerEvents({
      canvas,
      camera,
      blocks,
      glasses,
      zoomBy,
      panBetween: createCameraPan(camera, cameraTarget, glasses.bounds),
    }).unbind;
  };

  beforeEach(() => {
    frames.clear();
    nextFrame = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    zoomBy.mockClear();
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
    vi.unstubAllGlobals();
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
      syncSurface: vi.fn(),
      getBody: () => null,
    };
    const binding = bindPointerEvents({
      canvas,
      camera,
      blocks: [block],
      glasses,
      panBetween: createCameraPan(camera, cameraTarget, glasses.bounds),
    });
    unbind = binding.unbind;
    const { x, y } = glassPoint;
    send(Events.down, x, y);
    send(Events.move, x + 50, y);
    send(Events.up, x + 50, y);
    expect(block.beginGrab).toHaveBeenCalledOnce();
    expect(block.moveGrab).toHaveBeenCalledOnce();
    expect(block.endGrab).toHaveBeenCalledWith(true);
    expect(glasses.object.rotation.y).toBe(0);
    send(Events.down, x, y);
    binding.releaseBlock(block);
    expect(block.endGrab).toHaveBeenLastCalledWith(false);
    expect(captures.size).toBe(0);
    send(Events.move, x + 100, y);
    expect(block.moveGrab).toHaveBeenCalledOnce();
    send(Events.down, x, y, { pointerType: PointerTypes.touch });
    send(Events.down, x + 100, y, {
      pointerType: PointerTypes.touch,
      pointerId: 2,
      isPrimary: false,
    });
    expect(block.endGrab).toHaveBeenLastCalledWith(false);
    send(Events.up, x, y, { pointerType: PointerTypes.touch });
    send(Events.up, x + 100, y, {
      pointerType: PointerTypes.touch,
      pointerId: 2,
      isPrimary: false,
    });
    expect(block.endGrab).toHaveBeenLastCalledWith(false);
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

  it('zooms and pans with both touch pointers, then waits for all fingers to lift', () => {
    const before = cameraTarget.clone();
    const first = { pointerType: PointerTypes.touch, pointerId: 1 };
    const second = { pointerType: PointerTypes.touch, pointerId: 2, isPrimary: false };
    send(Events.down, 10, 300, first);
    send(Events.down, 110, 300, second);
    send(Events.move, 160, 300, second);
    flushGesture();
    expect(zoomBy).toHaveBeenLastCalledWith(1.5);
    send(Events.move, -40, 300, first);
    flushGesture();
    expect(zoomBy).toHaveBeenLastCalledWith(200 / 150);
    expect(cameraTarget.equals(before)).toBe(true);
    expect(glasses.object.rotation.y).toBe(0);
    const afterGesture = cameraTarget.clone();
    send(Events.up, 160, 300, second);
    send(Events.move, 100, 100, first);
    expect(cameraTarget.equals(afterGesture)).toBe(true);
    send(Events.up, 100, 100, first);
    expect(captures.size).toBe(0);
    send(Events.down, 10, 10, first);
    send(Events.move, 60, 10, first);
    expect(cameraTarget.x).toBeLessThan(before.x);
  });

  it.each(Object.values(PointerTypes))(
    'pans beyond the old clamp with %s without moving the glasses',
    (pointerType) => {
      const before = glasses.object.position.clone();
      send(Events.down, 10, 300, { pointerType });
      send(Events.move, 1000, 300, { pointerType });
      expect(cameraTarget.x).toBeLessThan(-0.8);
      expect(glasses.object.position.equals(before)).toBe(true);
      expect(glasses.object.rotation.y).toBe(0);
    },
  );

  it('pans with a two-finger drag beginning over a glass', () => {
    const before = cameraTarget.clone();
    const { x, y } = glassPoint;
    const first = { pointerType: PointerTypes.touch, pointerId: 1 };
    const second = { pointerType: PointerTypes.touch, pointerId: 2, isPrimary: false };
    send(Events.down, x, y, first);
    send(Events.down, x + 100, y, second);
    send(Events.move, x + 50, y, first);
    send(Events.move, x + 150, y, second);
    flushGesture();
    expect(cameraTarget.x).toBeLessThan(before.x);
    expect(glasses.object.rotation.y).toBe(0);
    send(Events.up, x + 50, y, first);
    send(Events.up, x + 150, y, second);
    expect(captures.size).toBe(0);
  });

  it('does not temporarily zoom when both fingers move together in a frame', () => {
    const first = { pointerType: PointerTypes.touch, pointerId: 1 };
    const second = { pointerType: PointerTypes.touch, pointerId: 2, isPrimary: false };
    send(Events.down, 10, 300, first);
    send(Events.down, 110, 300, second);
    send(Events.move, 90, 300, first);
    send(Events.move, 190, 300, second);
    flushGesture();
    expect(zoomBy).not.toHaveBeenCalled();
    expect(cameraTarget.x).toBeLessThan(0);
  });

  it.each([Events.cancel, Events.lost, Events.blur])(
    'cleans up a pinch on %s without stale gestures',
    (eventName) => {
      const first = { pointerType: PointerTypes.touch, pointerId: 1 };
      const second = { pointerType: PointerTypes.touch, pointerId: 2, isPrimary: false };
      send(Events.down, 10, 10, first);
      send(Events.down, 110, 10, second);
      if (eventName === Events.blur) {
        window.dispatchEvent(new Event(eventName));
      } else {
        send(eventName, 10, 10, first);
        send(eventName, 110, 10, second);
      }
      expect(captures.size).toBe(0);
      send(Events.move, 150, 10, second);
      expect(zoomBy).not.toHaveBeenCalled();
    },
  );
});
