onmessage = function (oEvent) {
    imgData = oEvent.data.imgData;
    max_x = oEvent.data.pos.x + oEvent.data.size.x;
    max_x = Math.min(max_x, imgData.height)
    max_y = oEvent.data.pos.y + oEvent.data.size.y;
    max_y = Math.min(max_y, imgData.width)
    min_x = oEvent.data.pos.x
    min_y = oEvent.data.pos.y
    var outimgData = new ImageData(oEvent.data.size.x, oEvent.data.size.y)
    for (var y = min_y; y < max_y; y++) {
        for (var x = min_x; x < max_x; x++) {
            var sum = 0;
            for (color = 0; color < 3; color++)
                sum += imgData.data[4 * y + 4 * x * imgData.width + color]
            for (color = 0; color < 3; color++)
                outimgData.data[4 * (y - min_y) + 4 * (x - min_x) * outimgData.width + color] = sum / 3
            outimgData.data[4 * (y - min_y) + 4 * (x - min_x) * outimgData.width + 3] = 255
        }
    }
    postMessage({
        imgData: outimgData,
        x: min_x,
        y: min_y
    });
};