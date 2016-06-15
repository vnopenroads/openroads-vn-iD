iD.BackgroundSource = function(data) {

    var tileGridOrigin = [-20037508.342789244, 20037508.342789244];
    var maxResolution = 156543.03392804097;

    function getTileResolution(zoom) {
        return maxResolution / Math.pow(2, zoom) * 256;
    }

    function bboxFromTile(x, y, z) {
        y = -y;
        var resolution = getTileResolution(z);
        return [
            tileGridOrigin[0] + resolution * x,
            tileGridOrigin[1] + resolution * (y - 1),
            tileGridOrigin[0] + resolution * (x + 1),
            tileGridOrigin[1] + resolution * (y)
        ].join(',');
    }

    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_numbers_to_lon..2Flat.
    // https://github.com/mapbox/whoots-js/blob/master/index.js
    function latLngFromTile(x, y, z) {
        var lng = x / Math.pow(2, z) * 360 - 180;
        var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
        var lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
        return [lng, lat];
    }

    var source = _.clone(data),
        offset = [0, 0],
        name = source.name;

    source.scaleExtent = data.scaleExtent || [0, 20];
    source.overzoom = data.overzoom !== false;

    source.offset = function(_) {
        if (!arguments.length) return offset;
        offset = _;
        return source;
    };

    source.nudge = function(_, zoomlevel) {
        offset[0] += _[0] / Math.pow(2, zoomlevel);
        offset[1] += _[1] / Math.pow(2, zoomlevel);
        return source;
    };

    source.name = function() {
        return name;
    };

    source.imageryUsed = function() {
        return source.id || name;
    };

    source.url = function(coord) {
        // for WMTS geoserver implementations
        if (data.type === 'wmts') {
            if (coord.length !== 3) {
                console.log('Invalid x/y/z coordinate', JSON.stringify(coord));
                return false;
            }
            var bbox = bboxFromTile(coord[0], coord[1], coord[2]);
            return data.template.replace('{bbox}', bbox);
        }

        // for TMS-style layers hosted from Mapbox-like services.
        return data.template
            .replace('{x}', coord[0])
            .replace('{y}', coord[1])
            // TMS-flipped y coordinate
            .replace(/\{[t-]y\}/, Math.pow(2, coord[2]) - coord[1] - 1)
            .replace(/\{z(oom)?\}/, coord[2])
            .replace(/\{switch:([^}]+)\}/, function(s, r) {
                var subdomains = r.split(',');
                return subdomains[(coord[0] + coord[1]) % subdomains.length];
            })
            .replace('{u}', function() {
                var u = '';
                for (var zoom = coord[2]; zoom > 0; zoom--) {
                    var b = 0;
                    var mask = 1 << (zoom - 1);
                    if ((coord[0] & mask) !== 0) b++;
                    if ((coord[1] & mask) !== 0) b += 2;
                    u += b.toString();
                }
                return u;
            });
    };

    source.intersects = function(extent) {
        extent = extent.polygon();
        return !data.polygon || data.polygon.some(function(polygon) {
            return iD.geo.polygonIntersectsPolygon(polygon, extent);
        });
    };

    source.validZoom = function(z) {
        return source.scaleExtent[0] <= z &&
            (source.overzoom || source.scaleExtent[1] > z);
    };

    source.isLocatorOverlay = function() {
        return name === 'Locator Overlay';
    };

    source.copyrightNotices = function() {};

    return source;
};

iD.BackgroundSource.Bing = function(data, dispatch) {
    // http://msdn.microsoft.com/en-us/library/ff701716.aspx
    // http://msdn.microsoft.com/en-us/library/ff701701.aspx

    data.template = 'https://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z';

    var bing = iD.BackgroundSource(data),
        key = 'Arzdiw4nlOJzRwOz__qailc8NiR31Tt51dN2D7cm57NrnceZnCpgOkmJhNpGoppU', // Same as P2 and JOSM
        url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial?include=ImageryProviders&key=' +
            key + '&jsonp={callback}',
        providers = [];

    d3.jsonp(url, function(json) {
        providers = json.resourceSets[0].resources[0].imageryProviders.map(function(provider) {
            return {
                attribution: provider.attribution,
                areas: provider.coverageAreas.map(function(area) {
                    return {
                        zoom: [area.zoomMin, area.zoomMax],
                        extent: iD.geo.Extent([area.bbox[1], area.bbox[0]], [area.bbox[3], area.bbox[2]])
                    };
                })
            };
        });
        dispatch.change();
    });

    bing.copyrightNotices = function(zoom, extent) {
        zoom = Math.min(zoom, 21);
        return providers.filter(function(provider) {
            return _.any(provider.areas, function(area) {
                return extent.intersects(area.extent) &&
                    area.zoom[0] <= zoom &&
                    area.zoom[1] >= zoom;
            });
        }).map(function(provider) {
            return provider.attribution;
        }).join(', ');
    };

    bing.logo = 'bing_maps.png';
    bing.terms_url = 'http://opengeodata.org/microsoft-imagery-details';

    return bing;
};

iD.BackgroundSource.None = function() {
    var source = iD.BackgroundSource({id: 'none', template: ''});

    source.name = function() {
        return t('background.none');
    };

    source.imageryUsed = function() {
        return 'None';
    };

    return source;
};

iD.BackgroundSource.Custom = function(template) {
    var source = iD.BackgroundSource({id: 'custom', template: template});

    source.name = function() {
        return t('background.custom');
    };

    source.imageryUsed = function() {
        return 'Custom (' + template + ')';
    };

    return source;
};
