// @vitest-environment jsdom
import * as THREE from 'three';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { getTheme, initializeTheme, setTheme, ThemeId, themeStorage } from './theme';
import { readScenePalette, recolorSceneMaterials } from '../three/theme';

const cssTokens = {
  '--color-world': '#0b1220',
  '--scene-shadow': '#020611',
  '--scene-environment': '#112744',
  '--scene-reflection-warm': '#7799d9',
  '--scene-reflection-cool': '#b9d1ff',
  '--scene-reflection-neutral': '#e2eaff',
  '--scene-glass-bottom': '#8c9db7',
  '--scene-glass-clear': '#dce8ff',
  '--scene-glass-metal': '#c1a879',
  '--scene-jelly-tint': '#c6d7ff',
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = ThemeId.Rose;
  Object.entries(cssTokens).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
});

afterEach(() => {
  Object.keys(cssTokens).forEach((key) => {
    document.documentElement.style.removeProperty(key);
  });
  document.documentElement.dataset.theme = ThemeId.Rose;
});

describe('Semesta themes', () => {
  it('defaults to Rose and restores only valid preferences', () => {
    initializeTheme();
    expect(getTheme()).toBe(ThemeId.Rose);
    localStorage.setItem(themeStorage.key, 'invalid');
    initializeTheme();
    expect(getTheme()).toBe(ThemeId.Rose);
    localStorage.setItem(themeStorage.key, ThemeId.Midnight);
    initializeTheme();
    expect(getTheme()).toBe(ThemeId.Midnight);
  });

  it('emits one event and stores Midnight Navy when switched', () => {
    const listener = vi.fn();
    window.addEventListener(themeStorage.event, listener);
    setTheme(ThemeId.Midnight);
    expect(getTheme()).toBe(ThemeId.Midnight);
    expect(localStorage.getItem(themeStorage.key)).toBe(ThemeId.Midnight);
    expect(listener).toHaveBeenCalledOnce();
    setTheme(ThemeId.Midnight);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(themeStorage.event, listener);
  });

  it('reads the CSS palette and recolours materials in place', () => {
    setTheme(ThemeId.Midnight);
    const palette = readScenePalette();
    expect(palette.world).toBe('#0b1220');
    const scene = new THREE.Scene();
    const glass = new THREE.MeshPhysicalMaterial({ color: '#ffffff' });
    const bottomTint = new THREE.Color('#ffffff');
    glass.userData.themeGlass = true;
    glass.userData.glassBottomTint = bottomTint;
    const jelly = new THREE.MeshPhysicalMaterial({ color: '#ffffff' });
    jelly.userData.themeJelly = true;
    const metal = new THREE.MeshStandardMaterial({ color: '#ffffff' });
    metal.userData.themeGold = true;
    const geometry = new THREE.BoxGeometry();
    const meshes = [glass, jelly, metal].map((material) => new THREE.Mesh(geometry, material));
    scene.add(...meshes);
    recolorSceneMaterials(scene, palette);
    expect(glass.color.getHexString()).toBe('dce8ff');
    expect(bottomTint.getHexString()).toBe('8c9db7');
    expect(jelly.attenuationColor.getHexString()).toBe('c6d7ff');
    expect(metal.color.getHexString()).toBe('c1a879');
    expect(scene.children).toEqual(meshes);
    geometry.dispose();
    glass.dispose();
    jelly.dispose();
    metal.dispose();
  });
});
