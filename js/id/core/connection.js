/* global qwest */
iD.Connection = function() {

    var event = d3.dispatch('authenticating', 'authenticated', 'auth', 'loading', 'load', 'loaded'),
        url = 'https://www.openstreetmap.org',
        openroads = 'http://orma.drvn.vn/api',
        testUrl = 'http://der.local:4000',
        connection = {},
        inflight = {},
        loadedTiles = {},
        tileZoom = 16,
        oauth = osmAuth({
            url: 'https://www.openstreetmap.org',
            oauth_consumer_key: 'tVvJwyxIViwjQcbu5C2OlJqcfWaCEGf8w2aqdx65',
            oauth_secret: 'OTmJkup1A4WDpMdEGImq6EJElg5t8mvUMBOj8IaQ',
            loading: authenticating,
            done: authenticated
        }),
        ndStr = 'nd',
        tagStr = 'tag',
        memberStr = 'member',
        nodeStr = 'node',
        wayStr = 'way',
        relationStr = 'relation',
        off;

    connection.changesetURL = function(changesetId) {
        return openroads + '/changesets/' + changesetId;
    };

    connection.base = function() {
        return openroads;
    };

    // TODO this endpoint hasn't been implemented yet.
    connection.changesetsURL = function(center, zoom) {
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        return url + '/history#map=' +
            Math.floor(zoom) + '/' +
            center[1].toFixed(precision) + '/' +
            center[0].toFixed(precision);
    };

    connection.entityURL = function(entity) {
        return openroads + '/xml/' + entity.type + '/' + entity.osmId();
    };

    // TODO endpoint also hasn't been implemented yet.
    connection.userURL = function(username) {
        return url + '/user/' + username;
    };

    connection.loadFromURL = function(url, callback) {
        function done(dom) {
            return callback(null, parse(dom));
        }
        return d3.xml(url).get().on('load', done);
    };

    connection.loadEntity = function(id, callback) {
        var type = iD.Entity.id.type(id),
            osmID = iD.Entity.id.toOSM(id);

        connection.loadFromURL(
            openroads + '/xml/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
            function(err, entities) {
                event.load(err, {data: entities});
                if (callback) callback(err, entities && _.find(entities, function(e) { return e.id === id; }));
            });
    };

    function authenticating() {
        event.authenticating();
    }

    function authenticated() {
        event.authenticated();
    }

    function getNodes(obj) {
        var elems = obj.getElementsByTagName(ndStr),
            nodes = new Array(elems.length);
        for (var i = 0, l = elems.length; i < l; i++) {
            nodes[i] = 'n' + elems[i].attributes.ref.value;
        }
        return nodes;
    }

    function getTags(obj) {
        var elems = obj.getElementsByTagName(tagStr),
            tags = {};
        for (var i = 0, l = elems.length; i < l; i++) {
            var attrs = elems[i].attributes;
            tags[attrs.k.value] = attrs.v.value;
        }
        return tags;
    }

    function getMembers(obj) {
        var elems = obj.getElementsByTagName(memberStr),
            members = new Array(elems.length);
        for (var i = 0, l = elems.length; i < l; i++) {
            var attrs = elems[i].attributes;
            members[i] = {
                id: attrs.type.value[0] + attrs.ref.value,
                type: attrs.type.value,
                role: attrs.role.value
            };
        }
        return members;
    }

    var parsers = {
        node: function nodeData(obj) {
            var attrs = obj.attributes;
            return new iD.Node({
                id: iD.Entity.id.fromOSM(nodeStr, attrs.id.value),
                loc: [parseFloat(attrs.lon.value), parseFloat(attrs.lat.value)],
                version: attrs.version.value,
                user: attrs.user && attrs.user.value,
                tags: getTags(obj)
            });
        },

        way: function wayData(obj) {
            var attrs = obj.attributes;
            return new iD.Way({
                id: iD.Entity.id.fromOSM(wayStr, attrs.id.value),
                version: attrs.version.value,
                user: attrs.user && attrs.user.value,
                tags: getTags(obj),
                nodes: getNodes(obj)
            });
        },

        relation: function relationData(obj) {
            var attrs = obj.attributes;
            return new iD.Relation({
                id: iD.Entity.id.fromOSM(relationStr, attrs.id.value),
                version: attrs.version.value,
                user: attrs.user && attrs.user.value,
                tags: getTags(obj),
                members: getMembers(obj)
            });
        }
    };

    function parse(dom) {
        if (!dom || !dom.childNodes) {
          return new Error('Bad request');
        }

        var root = dom.childNodes[0],
            children = root.childNodes,
            entities = [];

        for (var i = 0, l = children.length; i < l; i++) {
            var child = children[i],
                parser = parsers[child.nodeName];
            if (parser) {
                entities.push(parser(child));
            }
        }

        return entities;
    }

    connection.authenticated = function() {
        return oauth.authenticated();
    };

    // Generate Changeset XML. Returns a string.
    connection.changesetJXON = function(tags) {
        return {
            osm: {
                changeset: {
                    tag: _.map(tags, function(value, key) {
                        return { '@k': key, '@v': value };
                    }),
                    '@version': 0.1,
                    '@generator': 'openroads-iD'
                }
            }
        };
    };

    // Generate [osmChange](http://wiki.openstreetmap.org/wiki/OsmChange)
    // XML. Returns a string.
    connection.osmChangeJXON = function(changeset_id, changes) {
        function nest(x, order) {
            var groups = {};
            for (var i = 0; i < x.length; i++) {
                var tagName = Object.keys(x[i])[0];
                if (!groups[tagName]) groups[tagName] = [];
                groups[tagName].push(x[i][tagName]);
            }
            var ordered = {};
            order.forEach(function(o) {
                if (groups[o]) ordered[o] = groups[o];
            });
            return ordered;
        }

        function rep(entity) {
            return entity.asJXON(changeset_id);
        }

        return {
            osmChange: {
                '@version': 0.1,
                '@generator': 'openroads-iD',
                'create': nest(changes.created.map(rep), ['node', 'way', 'relation']),
                'modify': nest(changes.modified.map(rep), ['node', 'way', 'relation']),
                'delete': _.extend(nest(changes.deleted.map(rep), ['relation', 'way', 'node']), {'@if-unused': true})
            }
        };
    };

    connection.osmChangeJSON = function(changeset_id, changes) {
        function nest(x, order) {
            var groups = {};
            for (var i = 0; i < x.length; i++) {
                var tagName = Object.keys(x[i])[0];
                if (!groups[tagName]) groups[tagName] = [];
                groups[tagName].push(x[i][tagName]);
            }
            return groups;
        }

        function rep(entity) {
            return entity.asJSON(changeset_id);
        }

        return {
            osmChange: {
                'version': 0.1,
                'generator': 'openroads-iD',
                'create': nest(changes.created.map(rep)),
                'modify': nest(changes.modified.map(rep)),
                'delete': nest(changes.deleted.map(rep))
            }
        };
    };

    connection.changesetTags = function(comment, imageryUsed) {
        var tags = {
            imagery_used: imageryUsed.join(';').substr(0, 255),
            created_by: 'iD ' + iD.version
        };

        if (comment) {
            tags.comment = comment;
        }

        return tags;
    };

    connection.putChangeset = function(changes, comment, imageryUsed, callback) {

        //console.log(JXON.stringify(connection.osmChangeJXON('123', changes)));
        //console.log(JSON.stringify(connection.osmChangeJSON(1, changes)));
        userDetails = {
          id: 1245987,
          display_name: 'dev@developmentseed.org'
        }
        qwest.put(openroads + '/changeset/create', {
            uid: userDetails.id,
            user: userDetails.display_name,
            comment: comment
        }, {
            responseType: 'json',
        }).then(function(id) {
            var data = connection.osmChangeJSON(id, changes);
            console.log(JSON.stringify(data));
            qwest.post(openroads + '/changeset/' + id + '/upload', data, {
                dataType: 'json',
                responseType: 'json',
                retries: 1,
                timeout: 10000
            }).then(function(response) {
                callback(null, response.changeset.id);
            }).catch(function(error) {
                callback(error);
            });
        }).catch(function(error) {
            callback(error);
        });
    };

    var userDetails;

    connection.userDetails = function(callback) {
        if (userDetails) {
            callback(undefined, userDetails);
            return;
        }

        function done(err, user_details) {
            if (err) return callback(err);

            var u = user_details.getElementsByTagName('user')[0],
                img = u.getElementsByTagName('img'),
                image_url = '';

            if (img && img[0] && img[0].getAttribute('href')) {
                image_url = img[0].getAttribute('href');
            }

            userDetails = {
                display_name: u.attributes.display_name.value,
                image_url: image_url,
                id: u.attributes.id.value
            };

            callback(undefined, userDetails);
        }

        // To reiterate, we are still using OSM oauth for this portion of the code.
        oauth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, done);
    };

    connection.status = function(callback) {
        function done(capabilities) {
            var apiStatus = capabilities.getElementsByTagName('status');
            callback(undefined, apiStatus[0].getAttribute('api'));
        }

        // TODO this endpoint doesn't exist yet.
        d3.xml(url + '/api/capabilities').get()
            .on('load', done)
            .on('error', callback);
    };

    function abortRequest(i) { i.abort(); }

    connection.tileZoom = function(_) {
        if (!arguments.length) return tileZoom;
        tileZoom = _;
        return connection;
    };

    connection.loadTiles = function(projection, dimensions) {

        if (off) return;

        var s = projection.scale() * 2 * Math.PI,
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
            ts = 256 * Math.pow(2, z - tileZoom),
            origin = [
                s / 2 - projection.translate()[0],
                s / 2 - projection.translate()[1]];

        var tiles = d3.geo.tile()
            .scaleExtent([tileZoom, tileZoom])
            .scale(s)
            .size(dimensions)
            .translate(projection.translate())()
            .map(function(tile) {
                var x = tile[0] * ts - origin[0],
                    y = tile[1] * ts - origin[1];

                return {
                    id: tile.toString(),
                    extent: iD.geo.Extent(
                        projection.invert([x, y + ts]),
                        projection.invert([x + ts, y]))
                };
            });

        function bboxUrl(tile) {
            return openroads + '/xml/map?bbox=' + tile.extent.toParam();
        }

        _.filter(inflight, function(v, i) {
            var wanted = _.find(tiles, function(tile) {
                return i === tile.id;
            });
            if (!wanted) delete inflight[i];
            return !wanted;
        }).map(abortRequest);

        tiles.forEach(function(tile) {
            var id = tile.id;

            if (loadedTiles[id] || inflight[id]) return;

            if (_.isEmpty(inflight)) {
                event.loading();
            }

            inflight[id] = connection.loadFromURL(bboxUrl(tile), function(err, parsed) {
                loadedTiles[id] = true;
                delete inflight[id];

                event.load(err, _.extend({data: parsed}, tile));

                if (_.isEmpty(inflight)) {
                    event.loaded();
                }
            });
        });
    };

    connection.switch = function(options) {
        url = options.url;
        oauth.options(_.extend({
            loading: authenticating,
            done: authenticated
        }, options));
        event.auth();
        connection.flush();
        return connection;
    };

    connection.toggle = function(_) {
        off = !_;
        return connection;
    };

    connection.flush = function() {
        _.forEach(inflight, abortRequest);
        loadedTiles = {};
        inflight = {};
        return connection;
    };

    connection.loadedTiles = function(_) {
        if (!arguments.length) return loadedTiles;
        loadedTiles = _;
        return connection;
    };

    connection.logout = function() {
        oauth.logout();
        event.auth();
        return connection;
    };

    connection.authenticate = function(callback) {
        // Accept authentication without user login.
        // This is a temporary measure while a custom auth for openroads
        // is not implemented.
        return callback();
        // function done(err, res) {
        //     event.auth();
        //     if (callback) callback(err, res);
        // }
        // return oauth.authenticate(done);
    };

    return d3.rebind(connection, event, 'on');
};
