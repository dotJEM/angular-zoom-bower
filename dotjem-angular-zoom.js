(function () {
    var zoom = angular.module('dotjem.angular.zoom', ['dotjem.angular.events']);
    zoom.service('dxZoomViewModel', function () {
        var self = this;
        self.show = function (image, on, bounds, styles) {
            self.image = image;
            self.visible = on;
            self.bounds = bounds;
            self.styles = styles;
            self.viewStyles = angular.extend(styles, {
                top: bounds.y,
                width: bounds.width,
                height: bounds.height
            });
            update();
        };
        self.zoom = function (scale) {
            self.$scale = scale;
            //NOTE: Used for informational purpose, use $scale for calculation.
            self.zoomScale = scale < 2
                ? scale.toFixed(2) : scale < 4
                ? scale.toFixed(1) : Math.floor(scale);
            update();
        };
        self.move = function (x, y) {
            self.position = { x: x, y: y };
            update();
        };
        self.ready = function (size) {
            self.$size = size;
            update();
        };
        function update() {
            if (!self.$size || !self.bounds)
                return;
            var zoom = self.$scale;
            var relative = (self.bounds.width / self.$size.width);
            var zs = zoom * relative;
            var x = -(self.position.x * zoom) + (self.bounds.width / 2);
            var y = -(self.position.y * zoom) + (self.bounds.height / 2);
            self.zoomStyles = {
                transform: 'translate(' + x + 'px, ' + y + 'px) scale(' + zs + ')'
            };
        }
    });
    zoom.component('dxZoomView', {
        template: '<div class="dx-container" ng-style="$ctrl.model.viewStyles" ng-if="$ctrl.model.visible" style="position: absolute; z-index: 99;">' +
            '   <img ng-src="{{ $ctrl.model.image }}" ng-style="$ctrl.model.zoomStyles" dx-image-ready="$ctrl.ready($event)">' +
            '   <div class="dx-zoom-view-info">Scale: {{ $ctrl.model.zoomScale }}x</div>' +
            '</div>',
        controller: ['dxZoomViewModel', function (dxZoomViewModel) {
                var self = this;
                self.model = dxZoomViewModel;
                self.ready = function (img) {
                    img = img.element[0];
                    dxZoomViewModel.ready({ width: img.naturalWidth, height: img.naturalHeight });
                };
            }]
    });
    zoom.component('dxZoom', {
        template: '<div class="dx-overlay"' +
            '     ng-mousemove="$ctrl.onMouseMove($event)"' +
            '     ng-mouseleave="$ctrl.toggle($event,false);"' +
            '     ng-mouseenter="$ctrl.toggle($event,true);"' +
            '     dx-mouse-wheel="$ctrl.onMouseWheel($event)"></div>' +
            '<div class="dx-zoom-box" ng-style="$ctrl.boxStyles" ng-if="$ctrl.show"></div>' +
            '<div><img ng-src="{{ $ctrl.image }}" dx-image-ready="$ctrl.imageReady($event)" style="width: 100%;"></div>',
        bindings: {
            image: '@',
            enabled: '=',
            zoomImage: '@',
            zoomStyle: '='
        },
        controller: ['$element', 'dxZoomViewModel', function ($element, dxZoomViewModel) {
                var self = this;
                var model = dxZoomViewModel;
                self.$ratio = 1;
                self.$size = 100;
                self.$pos = { x: 0, y: 0 };
                self.imageReady = function (img) {
                    img = img.element[0];
                    self.$bounds = { w: img.naturalWidth, h: img.naturalHeight };
                    self.$ratio = self.$bounds.h / self.$bounds.w;
                };
                self.toggle = function (e, on) {
                    self.show = on;
                    var offset = $element.offset();
                    model.show(self.zoomImage, on, {
                        x: offset.left,
                        y: offset.top,
                        width: $element.width(),
                        height: $element.height(),
                        imageSize: {
                            width: self.$bounds.w, height: self.$bounds.h
                        }
                    }, self.zoomStyle);
                    model.zoom($element.width() / self.$size);
                    applyZoomBox();
                };
                self.onMouseMove = function (e) {
                    model.move(e.offsetX, e.offsetY);
                    self.$pos.x = e.offsetX;
                    self.$pos.y = e.offsetY;
                    applyZoomBox();
                };
                self.onMouseWheel = function (e) {
                    var f = -(e.deltaY / Math.abs(e.deltaY));
                    var size = self.$size + 10 * f;
                    if (size < 10)
                        size = 10;
                    if (size > $element.width())
                        size = $element.width();
                    model.zoom($element.width() / size);
                    self.$size = size;
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    e.preventDefault();
                    applyZoomBox();
                };
                function applyZoomBox() {
                    self.boxStyles = {
                        left: (self.$pos.x - self.$size / 2) + 'px',
                        top: (self.$pos.y - (self.$size * self.$ratio) / 2) + 'px',
                        width: self.$size + 'px',
                        height: (self.$size * self.$ratio) + 'px'
                    };
                }
            }]
    });
})();
