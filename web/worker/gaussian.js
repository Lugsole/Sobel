onmessage = function (oEvent) {
	var imgData = oEvent.data.imgData;
	
	var filter = oEvent.data.filter
    var max_x = oEvent.data.pos.x + oEvent.data.size.x;
    max_x = Math.min(max_x, imgData.height- filter[2])
    var max_y = oEvent.data.pos.y + oEvent.data.size.y;
    max_y = Math.min(max_y, imgData.width- filter[2])
    var min_x = oEvent.data.pos.x
	var min_y = oEvent.data.pos.y
	min_x = Math.max(filter[2],min_x)
    min_y = Math.max(filter[2],min_y)
    console.log(filter)
    console.log(`min_x = ${min_x},min_y = ${min_y},max_x = ${max_x},max_y = ${max_y},`)
    var outimgData = new ImageData(oEvent.data.size.x, oEvent.data.size.y)
    for (var y = min_y; y < max_y; y++) {
        for (var x = min_x; x < max_x; x++) {
            var sum = 0;
            for (x1 = 0; x1 < filter[1]; x1++)
                for (y1 = 0; y1 < filter[1]; y1++)
                    sum += imgData.data[4 * (y + y1 - filter[2]) + 4 * (x + x1 - filter[2]) * imgData.width] * filter[0][x1 * filter[2] + y1];
            for (var color = 0; color < 3; color++)
                outimgData.data[4 * (y - (oEvent.data.pos.x + oEvent.data.size.x)) + 4 * (x - (oEvent.data.pos.x + oEvent.data.size.x)) * outimgData.width + color] = sum /  filter[3]
            outimgData.data[4 * (y - (oEvent.data.pos.x + oEvent.data.size.x)) + 4 * (x - (oEvent.data.pos.x + oEvent.data.size.x)) * outimgData.width + 3] = 255
        }
    }
    postMessage({
        imgData: outimgData,
        x: oEvent.data.pos.x,
        y: oEvent.data.pos.y
    });
};