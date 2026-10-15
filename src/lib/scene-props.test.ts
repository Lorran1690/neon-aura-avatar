import { describe, expect, it } from 'vitest';
import { applyProps } from '@react-three/fiber';
import { Group, BufferAttribute } from 'three';
import { cleanSceneProps } from './scene-props';

describe('Editor metadata at the WebGL boundary', () => {
  it('removes source metadata before R3F applies pierced properties', () => {
    const group = new Group();
    const props = { 'data-tsd-source': 'AvatarScene.tsx:133', position: [1, 2, 3] as [number, number, number] };
    expect(cleanSceneProps(props)).not.toHaveProperty('data-tsd-source');
    // A pierced metadata path can become invalid after an editor update.
    Object.assign(group, { data: null });
    expect(() => applyProps(group, props)).toThrow('Cannot set "data-tsd-source"');
    expect(() => applyProps(group, cleanSceneProps(props))).not.toThrow();
    expect(group.position.toArray()).toEqual([1, 2, 3]);
  });
  it('preserves geometry buffer data while removing DOM-only metadata', () => {
    const data = new Float32Array([1, 2, 3]);
    const attribute = new BufferAttribute(data, 3);
    const props = cleanSceneProps({ 'data-tsd-source': 'geometry', 'data-testid': 'buffer', array: data, itemSize: 3 });
    expect(Object.keys(props)).toEqual(['array', 'itemSize']);
    expect(() => applyProps(attribute, props)).not.toThrow();
    expect(attribute.array).toBe(data);
  });
});