# Resources Directory

This directory contains resources used by the electron-builder to create the Windows application.

## Required Files

- **icon.ico**: The application icon used for the Windows executable, taskbar, and Start menu. This should be an ICO file with multiple sizes (16x16 to 256x256).

## Creating an Icon File

To create a proper icon file:

1. Design your icon in an image editor (Photoshop, GIMP, etc.)
2. Create versions at these sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
3. Use an ICO converter tool or online service to combine these into a single .ico file
4. Save the file as `icon.ico` in this directory

## Additional Resources

You can also place other application resources in this directory, such as:

- Splash screen images
- Default backgrounds
- Other application assets

These will be bundled with your application when it's packaged. 