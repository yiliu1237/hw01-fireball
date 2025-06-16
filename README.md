# Animated Flame Mesh

This project demonstrates a stylized, animated fireball rendered with WebGL using layered noise-based vertex displacements and fragment shading. The flame effect is enhanced with GUI controls, interactive mouse-based deformation, and a post-processing snow shader.

## Demo
![Fireball Demo](demo/demo.gif)


## Features
- Animated flame using layered Icospheres with independent noise-driven shaders
- Gradient color shading based on surface normal and position
- Time-based vertex displacement (sine and FBM)
- Background environment cube enclosing the fireball
- Mouse interaction that deforms the flame near the cursor
- GUI (dat.GUI) with the following parameters:
  - Outer flame color
  - Inner flame layer colors (3 layers)
  - Noise octaves
  - Speed
  - Tesselation level
  - "Reset" button
- Post-processing snow shader drawn over full-screen quad

