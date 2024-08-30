import 'leaflet-draw';
import '../map/Arc';

var _extends =
	Object.assign ||
	function (target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];

			for (var key in source) {
				if (Object.prototype.hasOwnProperty.call(source, key)) {
					target[key] = source[key];
				}
			}
		}

		return target;
	};

L.drawLocal.draw.toolbar.buttons.arc = 'Draw an Arc';

L.drawLocal.draw.handlers.arc = {
	tooltip: {
		start: 'Click to set Arc center.',
		line: 'Click to set RadiusX, then set RadiusY.',
		end: 'Click to set End Bearing and create Arc',
	},
	radius: 'RadiusX (meters): ',
	bearing: 'Bearing (degrees): ',
};

L.Draw.SimpleShape = L.Draw.Feature.extend({
	options: {
		repeatMode: false,
	},

	initialize: function (map, options) {
		this._endLabelText = L.drawLocal.draw.handlers.simpleshape.tooltip.end;
		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map && !this._shape) {
			this._mapDraggable = this._map.dragging.enabled();

			if (this._mapDraggable) {
				this._map.dragging.disable();
			}

			this._container.style.cursor = 'crosshair';

			this._tooltip = this._tooltip || new L.Tooltip(this._map);
			this._tooltip.updateContent({ text: this._initialLabelText });

			this._map
				.on('mousedown', this._onMouseDown, this)
				.on('mousemove', this._onMouseMove, this)
				.on('touchstart', this._onMouseDown, this)
				.on('touchmove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);
		if (this._map) {
			if (this._mapDraggable) {
				this._map.dragging.enable();
			}

			this._container.style.cursor = '';

			this._map
				.off('mousedown', this._onMouseDown, this)
				.off('mousemove', this._onMouseMove, this)
				.off('touchstart', this._onMouseDown, this)
				.off('touchmove', this._onMouseMove, this);

			L.DomEvent.off(document, 'mouseup', this._onMouseUp, this);
			L.DomEvent.off(document, 'touchend', this._onMouseUp, this);

			if (this._shape) {
				this._map.removeLayer(this._shape);
				delete this._shape;
			}

			if (this._tooltip) {
				this._tooltip.dispose();
				this._tooltip = null;
			}
		}
		this._isDrawing = false;
	},

	_getTooltipText: function () {
		return {
			text: this._endLabelText,
		};
	},

	_onMouseDown: function (e) {
		this._isDrawing = true;
		this._startLatLng = e.latlng;
		L.DomEvent.on(document, 'mouseup', this._onMouseUp, this)
			.on(document, 'touchend', this._onMouseUp, this)
			.preventDefault(e.originalEvent);
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		if (this._tooltip) {
			this._tooltip.updatePosition(latlng);
		}
		if (this._isDrawing) {
			this._tooltip.updateContent(this._getTooltipText());
			this._drawShape(latlng);
		}
	},

	_onMouseUp: function () {
		if (this._shape) {
			this._fireCreatedEvent();
		}

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},
});

L.Draw.Arc = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'arc',
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 5,
			opacity: 0.5,
			fillOpacity: 0.2,
			clickable: true,
		},
		showRadius: true,
		metric: true,
		lineOptions: {
			color: '#3388ff',
			weight: 5,
			dashArray: '5, 10',
		},
	},

	initialize: function initialize(map, options) {
		if (options && options.shapeOptions) {
			options.shapeOptions = L.Util.extend(
				{},
				this.options.shapeOptions,
				options.shapeOptions
			);
		}
		if (options && options.lineOptions) {
			options.lineOptions = L.Util.extend(
				{},
				this.options.lineOptions,
				options.lineOptions
			);
		}
		this.type = L.Draw.Arc.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.arc.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_fireCreatedEvent: function _fireCreatedEvent(e) {
		var arc = L.arc(
			_extends({}, this.options.shapeOptions, {
				center: this._startLatLng,
				radiusX: this._radiusX,
				radiusY: this._radiusY,
				startBearing: this._startBearing,
				endBearing: this._endBearing,
			})
		);

		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, arc);

		this._cleanupAfterDrawing();
	},

	_cleanupAfterDrawing: function () {
		if (this._lineX) {
			this._map.removeLayer(this._lineX);
			this._lineX = null;
		}
		if (this._lineY) {
			this._map.removeLayer(this._lineY);
			this._lineY = null;
		}

		this.disable();
		this._startLatLng = null;
		this._radiusX = null;
		this._radiusY = null;
		this._endBearing = null;

		this._map.dragging.enable();
		this._container.style.cursor = '';

		if (this._tooltip) {
			this._tooltip.dispose();
			this._tooltip = null;
		}
	},

	_drawLineX: function _drawLineX(latlng) {
		if (!this._lineX) {
			this._lineX = L.polyline(
				[this._startLatLng, latlng],
				this.options.lineOptions
			);
			this._map.addLayer(this._lineX);
		} else {
			this._lineX.setLatLngs([this._startLatLng, latlng]);
		}
	},

	_drawLineY: function _drawLineY(latlng) {
		if (!this._lineY) {
			this._lineY = L.polyline(
				[this._startLatLng, latlng],
				this.options.lineOptions
			);
			this._map.addLayer(this._lineY);
		} else {
			this._lineY.setLatLngs([this._startLatLng, latlng]);
		}
	},

	_drawShape: function _drawShape(latlng) {
		var pc, ph, v, bearing;

		if (!this._shape) {
			this._shape = L.arc(
				_extends(
					{
						center: this._startLatLng,
						radiusX: this._radiusX,
						radiusY: this._radiusY,
						startBearing: this._startBearing || 0,
						endBearing: this._startBearing || 1,
						numberOfPoints: 100,
					},
					this.options.shapeOptions
				)
			);
			this._map.addLayer(this._shape);
		}

		pc = this._map.project(this._startLatLng);
		ph = this._map.project(latlng);
		v = [ph.x - pc.x, ph.y - pc.y];
		bearing = ((Math.atan2(v[0], -v[1]) * 180) / Math.PI) % 360;

		this._shape.setEndBearing(bearing);
		this._shape.setLatLngs(this._shape.getLatLngs());
	},

	_onMouseMove: function _onMouseMove(e) {
		var latlng = e.latlng;

		if (this._tooltip) {
			this._tooltip.updatePosition(latlng);
		}

		if (this._isDrawing) {
			if (this._startLatLng && !this._radiusX) {
				this._drawLineX(latlng);
				if (this._tooltip) {
					this._tooltip.updateContent({
						text: 'Click to set the X radius',
						subtext: `RadiusX: ${this._startLatLng
							.distanceTo(latlng)
							.toFixed(2)} meters`,
					});
				}
			} else if (this._radiusX && !this._radiusY) {
				this._drawLineY(latlng);
				if (this._tooltip) {
					this._tooltip.updateContent({
						text: 'Click to set the Y radius',
						subtext: `RadiusY: ${this._startLatLng
							.distanceTo(latlng)
							.toFixed(2)} meters`,
					});
				}
			} else if (this._radiusY && !this._endBearing) {
				this._drawShape(latlng);
				var pc = this._map.project(this._startLatLng);
				var ph = this._map.project(latlng);
				var v = [ph.x - pc.x, ph.y - pc.y];
				var bearing = ((Math.atan2(v[0], -v[1]) * 180) / Math.PI) % 360;

				if (this._tooltip) {
					this._tooltip.updateContent({
						text: 'Click to set the End Bearing',
						subtext: `Bearing(degrees): ${bearing.toFixed(2)}`,
					});
				}
			}
		}
	},

	_onMouseDown: function _onMouseDown(e) {
		var latlng = e.latlng;

		var pc, ph, v, newB;

		this._isDrawing = true;

		if (!this._startLatLng) {
			this._startLatLng = latlng;
		} else if (!this._radiusX) {
			pc = this._map.project(this._startLatLng);
			ph = this._map.project(latlng);
			v = [ph.x - pc.x, ph.y - pc.y];

			newB = ((Math.atan2(v[0], -v[1]) * 180) / Math.PI) % 360;

			this._startBearing = newB;
			this._radiusX = this._startLatLng.distanceTo(latlng);
			this._drawLineX(latlng);
		} else if (!this._radiusY) {
			this._radiusY = this._startLatLng.distanceTo(latlng);
			this._drawLineY(latlng);
			this._drawShape(latlng);
		} else if (!this._endBearing) {
			pc = this._map.project(this._startLatLng);
			ph = this._map.project(latlng);
			v = [ph.x - pc.x, ph.y - pc.y];

			newB = ((Math.atan2(v[0], -v[1]) * 180) / Math.PI) % 360;

			this._endBearing = newB;
			this._fireCreatedEvent(e);
		}
	},
});

L.Edit.Arc = L.Edit.SimpleShape.extend({
	addHooks: function () {
		L.Draw.SimpleShape.prototype.addHooks.call(this);
		if (this._shape._map) {
			this._initialState = {
				center: this._shape.getCenter(),
				radiusX: this._shape.getRadiusX(),
				radiusY: this._shape.getRadiusY(),
				startBearing: this._shape.getStartBearing(),
				endBearing: this._shape.getEndBearing(),
				latLngs: this._shape.getLatLngs(),
			};
			this._initMarkers();
		}
	},

	removeHooks: function () {
		L.Draw.SimpleShape.prototype.removeHooks.call(this);
		this._clearMarkers();
	},

	_initMarkers: function () {
		if (!this.options.rotateIcon) {
			this.options.rotateIcon = new L.DivIcon({
				iconSize: new L.Point(8, 8),
				className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-rotate',
			});
		}

		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}

		this._createRotateMarker();
		this._createMoveMarker();
		this._markerGroup.addTo(this._shape._map);
	},

	_createRotateMarker: function () {
		var bearing =
			(this._shape.getEndBearing() + this._shape.getStartBearing()) / 2;
		var center = this._shape.getCenter();
		var radiusX = this._shape.getRadiusX();
		var radiusY = this._shape.getRadiusY();

		// Calculate the maximum radius and then multiply by a factor to place the marker outside the arc
		var distance = Math.max(radiusX, radiusY);

		// Calculate the new point using trigonometry
		var angleRad = (bearing * Math.PI) / 180; // Convert bearing to radians
		var latOffset = (distance / 6378137) * (180 / Math.PI); // Earth's radius in meters
		var lngOffset =
			((distance / 6378137) * (180 / Math.PI)) /
			Math.cos((center.lat * Math.PI) / 180);

		var point = L.latLng(
			center.lat + latOffset * Math.sin(angleRad),
			center.lng + lngOffset * Math.cos(angleRad)
		);

		this._rotateMarker = this._createMarker(point, this.options.rotateIcon);

		this._rotateMarker.on('drag', this._onRotateMarkerDrag, this);
		this._markerGroup.addLayer(this._rotateMarker);
	},

	_createMoveMarker: function () {
		var center = this._shape.getCenter();
		this._moveMarker = this._createMarker(
			center,
			this.options.moveIcon ||
				new L.DivIcon({
					iconSize: new L.Point(8, 8),
					className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move',
				})
		);

		this._moveMarker.on('drag', this._onMoveMarkerDrag, this);
		this._markerGroup.addLayer(this._moveMarker);
	},

	_onRotateMarkerDrag: function (e) {
		const latlng = e.target.getLatLng();
		const center = this._shape.getCenter();
		const angle =
			Math.atan2(latlng.lng - center.lng, latlng.lat - center.lat) *
			(180 / Math.PI);
		const rotationAngle = angle - (this._currentAngle || 0);
		this._rotateShape(rotationAngle);
		this._currentAngle = angle;
	},

	_onMoveMarkerDrag: function (e) {
		const latlng = e.target.getLatLng();
		this._moveShape(latlng);
	},

	_rotateShape: function (angle) {
		const startBearing = (this._shape.getStartBearing() + angle) % 360;
		const endBearing = (this._shape.getEndBearing() + angle) % 360;
		this._shape.setStartBearing(startBearing);
		this._shape.setEndBearing(endBearing);
		this._shape.setLatLngs(this._shape.getLatLngs());
		this._repositionMarkers();
	},

	_moveShape: function (newCenter) {
		const offsetLat = newCenter.lat - this._shape.getCenter().lat;
		const offsetLng = newCenter.lng - this._shape.getCenter().lng;

		this._shape.setCenter(newCenter);

		const latLngs = this._shape.getLatLngs().map((latlng) => {
			return L.latLng(latlng.lat + offsetLat, latlng.lng + offsetLng);
		});
		this._shape.setLatLngs(latLngs);

		this._repositionMarkers();
	},

	_repositionMarkers: function () {
		this._repositionRotateMarker();
		this._repositionMoveMarker();
	},

	_repositionRotateMarker: function () {
		const bearing =
			(this._shape.getEndBearing() + this._shape.getStartBearing()) / 2;
		const distance = this._shape.getRadiusX() * 1.5 + 50; // Position rotate marker further outside
		const point = this._shape.computeDestinationPoint(
			this._shape.getCenter(),
			distance,
			bearing
		);
		if (this._rotateMarker) {
			this._rotateMarker.setLatLng(point);
		}
	},

	_repositionMoveMarker: function () {
		if (this._moveMarker) {
			this._moveMarker.setLatLng(this._shape.getCenter());
		}
	},

	_clearMarkers: function () {
		if (this._rotateMarker) {
			this._rotateMarker.off('drag', this._onRotateMarkerDrag, this);
			this._markerGroup.removeLayer(this._rotateMarker);
			this._rotateMarker = null;
		}

		if (this._moveMarker) {
			this._moveMarker.off('drag', this._onMoveMarkerDrag, this);
			this._markerGroup.removeLayer(this._moveMarker);
			this._moveMarker = null;
		}

		if (this._markerGroup) {
			this._shape._map.removeLayer(this._markerGroup);
			this._markerGroup = null;
		}
	},
});

L.Arc.addInitHook(function () {
	if (L.Edit.Arc) {
		this.editing = new L.Edit.Arc(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});
