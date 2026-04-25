const modelFamilies = [
  {
    group: 'Flux Series',
    names: ['Flux Pro Ultra', 'Flux Dev', 'Flux Schnell', 'Flux Cine', 'Flux Realism'],
    autoCount: 42,
  },
  {
    group: 'SDXL & Stable Diffusion',
    names: ['SDXL Turbo', 'SDXL Lightning', 'Juggernaut XL', 'RealVis XL', 'DreamShaper XL'],
    autoCount: 40,
  },
  {
    group: 'Midjourney-style',
    names: ['MJ Aesthetic v7', 'MJ Hyper Real', 'Stylized NeoDream', 'Arthouse Promptlock'],
    autoCount: 36,
  },
  {
    group: 'Video Foundations',
    names: ['Kling v2.1', 'Sora Creative', 'Veo 3 Motion', 'Runway Gen4 Style'],
    autoCount: 34,
  },
  {
    group: 'Cinema & Narrative',
    names: ['Cinema Director', 'Anamorphic Master', 'Storyboard Diffuser', 'LensCraft 8K'],
    autoCount: 30,
  },
  {
    group: 'Lip Sync & Character',
    names: ['LipSync HyperFace', 'Portrait Drive', 'Avatar Voice Weave', 'FaceFlow 4D'],
    autoCount: 28,
  },
];

export function createModelCatalog() {
  const catalog = [];

  modelFamilies.forEach((family) => {
    const models = [...family.names];
    const autoBases = ['Creator', 'Turbo', 'Hyper', 'Neo', 'Studio', 'Prime'];

    for (let i = 0; i < family.autoCount; i += 1) {
      const base = autoBases[i % autoBases.length];
      const suffix = Math.floor(i / autoBases.length) + 1;
      models.push(`${family.group.split(' ')[0]} ${base} ${suffix}`);
    }

    catalog.push({ group: family.group, models });
  });

  return catalog;
}

export const defaultModel = 'Flux Pro Ultra';
