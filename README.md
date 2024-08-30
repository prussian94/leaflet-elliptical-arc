# Leaflet Elliptical Arc Drawing Tool

This tool is an extension of the Leaflet library, allowing users to draw elliptical arcs on a map. Inspired by the `leaflet.arc` plugin, which is designed for drawing circular arcs, this tool enhances functionality by supporting the creation of elliptical arcs with adjustable radii, bearings, and other customizable options.

## Features

- **Elliptical Arcs:** Unlike the original `leaflet.arc`, which is limited to circular arcs, this tool allows for the creation of elliptical arcs with different radii along the X and Y axes.
- **Editable Arcs:** Once an arc is drawn, it can be edited by adjusting its center, start and end bearings, and radii.
- **Move and Rotate:** The tool includes functionality to move the entire arc or rotate it around its center.
- **Customizable Options:** Easily configure the appearance and behavior of the arcs, including stroke color, weight, and opacity.

## Installation

To use this tool in your project, you can include it in your project via the following steps:

1. **Clone the repository:**

   ```sh
   git clone https://github.com/prussian94/leaflet-elliptical-arc.git
   ```

2. **Include the necessary files in your project:**

   Make sure to include both the `arc.js` and `arc.draw.js` files, along with the necessary Leaflet and Leaflet-Draw libraries.

3. **Add the tool to your Leaflet map:**

   Here's an example of how to add the elliptical arc drawing tool to your Leaflet map:

   ```js
   import L from 'leaflet';
   import 'leaflet-draw';
   import './Arc';
   import './ArcDraw';

   const map = L.map('map').setView([51.505, -0.09], 13);

   const drawControl = new L.Control.Draw({
   	draw: {
   		arc: true, // Enables the arc drawing tool
   	},
   });

   map.addControl(drawControl);

   map.on(L.Draw.Event.CREATED, function (event) {
   	const layer = event.layer;
   	map.addLayer(layer);
   });
   ```

## Usage

- **Drawing an Arc:** Use the draw toolbar to select the arc tool and click on the map to define the center, radii, and bearings of the arc.
- **Editing an Arc:** After drawing, when edit mode of leaflet-draw is on, you can move the arc by dragging the center marker or rotate it using the rotate marker placed outside the arc.

## Credits

This tool was developed by [Hakan Apohan](https://github.com/prussian94), inspired by the jjwtay's `leaflet.arc` plugin.

## License

This project is licensed under the MIT License.
