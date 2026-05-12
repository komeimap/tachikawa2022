        var map = L.map('map').setView([35.696228, 139.419084], 16);

        mapLink = '<a href="https://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ' + mapLink + 'Contributors ',
            maxZoom: 19,
        }).addTo(map);

        //標準地図
        // mapLink = '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>';
        // L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
        //     attribution: '&copy; ' + mapLink,
        //     maxZoom: 18,
        // }).addTo(map);

        //淡色地図
        // mapLink = '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>';
        // L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
        //     attribution: '&copy; ' + mapLink,
        //     maxZoom: 18,
        // }).addTo(map);


        var marker;
        marker = L.marker([35.696228, 139.419084]).addTo(map)
            .bindPopup('<font size="32px" color="red">●</font><font size="10px">をタップで<br>&nbsp;&nbsp;情報表示</font>')
            .openPopup();

        var svg = d3.select(map.getPanes().overlayPane).append('svg'),
            g = svg.append('g').attr('class', 'leaflet-zoom-hide');

        var div = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('float', 'left')
            .style('opacity', 0);

        function checked() {
            document.getElementById("toggle").checked = true;

        };

        document.getElementById("toggle").checked = false;

        function removeMarker() {
            map.removeLayer(marker);
        };

        function detail(link) {
            link = trimValue(link);
            if (link.length == 0) {
                return " ";
            } else {
                console.log(link.length);
                //return '</br><a href="' + link + '">詳細</a>';
                return '</br><a id="syousai" href="' + escapeAttr(link) + '" onclick="window.open(this.href); return false;">詳細</a>'
            };


        }

        function trimValue(value) {
            return value ? String(value).replace(/^\s+|\s+$/g, '') : '';
        }

        function escapeHtml(value) {
            return trimValue(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function escapeAttr(value) {
            return escapeHtml(value);
        }

        function isLink(value) {
            return /^https?:\/\//i.test(trimValue(value));
        }

        function imageSrc(image) {
            var name = trimValue(image);

            if (name.length == 0) {
                name = 'no-image';
            }

            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) {
                return name.indexOf('/') >= 0 ? name : 'images/' + name;
            }

            return 'images/' + name + '.jpg';
        }

        function imageCaption(result, label) {
            var caption = trimValue(result);
            return label ? label + ': ' + caption : caption;
        }

        function collectImages(d) {
            var images = [];
            var imageFields = ['Image', 'Image2', 'Image3', 'Image4', 'Image5'];

            imageFields.forEach(function(field) {
                var image = trimValue(d[field]);

                if (image.length > 0 && !isLink(image)) {
                    images.push(image);
                }
            });

            if (images.length == 0) {
                images.push('no-image');
            }

            return images;
        }

        function detailLink(d) {
            var link = trimValue(d.Detail);
            var fallbackFields = ['Image2', 'Image3', 'Image4', 'Image5', 'ImageMode'];

            if (link.length > 0) {
                return link;
            }

            for (var i = 0; i < fallbackFields.length; i++) {
                link = trimValue(d[fallbackFields[i]]);

                if (isLink(link)) {
                    return link;
                }
            }

            return '';
        }

        function imageItemHtml(image, result, label, className) {
            var src = imageSrc(image);
            var labelHtml = label ? '<div class="tooltip_image_label">' + escapeHtml(label) + '</div>' : '';

            return '<div class="' + className + '">' +
                labelHtml +
                '<a href="' + escapeAttr(src) + '" data-fancybox data-caption="' + escapeAttr(imageCaption(result, label)) + '">' +
                '<img class="tooltip_img" src="' + escapeAttr(src) + '"/>' +
                '</a>' +
                '</div>';
        }

        function imagesHtml(d) {
            var images = collectImages(d);
            var mode = trimValue(d.ImageMode).toLowerCase();

            if (mode == 'before_after' && images.length >= 2) {
                return '<div class="tooltip_images tooltip_images_before_after">' +
                    imageItemHtml(images[0], d.Result, 'Before', 'tooltip_image_item') +
                    '<div class="tooltip_image_arrow"></div>' +
                    imageItemHtml(images[1], d.Result, 'After', 'tooltip_image_item') +
                    '</div>';
            }

            return '<div class="tooltip_images">' +
                images.map(function(image) {
                    return imageItemHtml(image, d.Result, '', 'tooltip_image_item');
                }).join('') +
                '</div>';
        }

        function tooltipHtml(d) {
            return '<input type="image" style="position: absolute; right: 2%;" src="images/close.png" alt="" onClick="closeTooltip();">' +
                '<table id="tooltip_table" width="95%" border="0" cellspacing="0" cellpadding="0"><tr><td class="tooltip_title_cell" colspan="2"><b>' +
                escapeHtml(d.Result) + '</b></td></tr>' +
                '<tr><td class="tooltip_media_cell" width="50%">' + imagesHtml(d) + '</td><td class="tooltip_text_cell" width="50%">' + escapeHtml(d.Description) +
                detail(detailLink(d)) +
                '</td></tr></table>';
        }


        d3.json('tOutline.json', function(error, collection) {
            if (error) throw error;

            d3.csv('data.csv', function(error, point) {
                if (error) throw error;


                console.log(collection);
		console.log(point);

                var transform = d3.geo.transform({
                        point: projectPoint
                    }),
                    path = d3.geo.path().projection(transform);

                var feature = g.selectAll('path')
                    .data(collection.features)
                    .enter().append('path');


                map.on('viewreset', reset);
                reset();

                function reset() {

                    bounds = path.bounds(collection);
                    var topLeft = bounds[0],
                        bottomRight = bounds[1];

                    svg.attr('width', bottomRight[0] - topLeft[0])
                        .attr('height', bottomRight[1] - topLeft[1])
                        .style('left', topLeft[0] + "px")
                        .style('top', topLeft[1] + "px");

                    g.attr('transform', 'translate(' + -topLeft[0] + "," + -topLeft[1] + ')');

                    feature.attr('d', path)
                        .style('stroke', 'steelblue')
                        .style('stroke-width', '0.5px')
                        .style('fill-opacity', .3)
                        .style('fill', 'white')
                        .on('click', function(d) {
                            div.transition().duration(500)
                                .style('opacity', 0);
                            document.getElementById("toggle").checked = false;

                            removeMarker();

                        });


                }

                function projectPoint(x, y) {
                    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
                    this.stream.point(point.x, point.y);
                }


                point.forEach(function(d) {
                    d.Lat = +d.Lat,
                        d.Lng = +d.Lng;
                    d.LatLngObj = new L.LatLng(d.Lat, d.Lng);
                });

                var circle = g.selectAll('circle')
                    .data(point)
                    .enter()
                    .append('circle')
                    .attr('class', 'dots')
                    .attr({
                        'opacity': .7,
                        'fill': 'red',
                        'r': 12
                    })
                    .on('click', function(d) {
                        d3.select(this).transition()
                            .duration(400)
                            .ease('elastic')
                            .attr('r', 35)
                            .transition()
                            .duration(100)
                            .ease('elastic')
                            .attr('r', 12)

                        div.transition().duration(200)
                            .style('opacity', 1);
                        div.html(tooltipHtml(d));

                        checked();
                        removeMarker();
                    });

                circle.transition()
                    .delay(400)
                    .duration(200)
                    .ease('elastic')
                    .attr('r', 35)
                    .style('fill', '#fcc')
                    .transition()
                    .duration(200)
                    .ease('bounce')
                    .attr('r', 12)
                    .style('fill', 'red');


                map.on('viewreset', update);

                update();


                function update() {
                    circle.attr('transform', function(d) {
                        return 'translate(' +
                            map.latLngToLayerPoint(d.LatLngObj).x + ',' +
                            map.latLngToLayerPoint(d.LatLngObj).y + ')';
                    });
                };


            });
        });

        function closeTooltip() {
          div.transition().duration(500)
              .style('opacity', 0);
          document.getElementById("toggle").checked = false;
        }

        function setCenter() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        var data = position.coords;

                        var lat = data.latitude;
                        var lng = data.longitude;

                        marker = L.marker([lat, lng]).addTo(map);

                        map.setView([lat, lng], 18);
                    });
            } else {
                alert("あなたの端末では、現在位置を取得できません。");
            };
        };
