var greek = 1.4;
document.getElementById("input").onload = function () {
    edge_detect();
};

function edge_detect() {
    var start = Date.now();
    var img = document.getElementById("input");
    /* set up for creating the black and white image */
    var black_white_c = document.getElementById("black_white");
    black_white_c.height = img.height
    black_white_c.width = img.width
    var black_white_ctx = black_white_c.getContext("2d");

    black_white_ctx.drawImage(img, 0, 0);
    /* create a black and white image */
    var imgData = black_white_ctx.getImageData(0, 0, black_white_c.width, black_white_c.height);
    var i;
    for (y = 0; y < black_white_c.width; y++) {
        for (x = 0; x < black_white_c.height; x++) {
            var sum = 0;
            for (color = 0; color < 3; color++)
                sum += imgData.data[4 * y + 4 * x * black_white_c.width + color]
            for (color = 0; color < 3; color++)
                imgData.data[4 * y + 4 * x * black_white_c.width + color] = sum / 3
        }
    }

    black_white_ctx.putImageData(imgData, 0, 0);
    document.getElementById("img_black_white").src = black_white_c.toDataURL();
    black_white_c.height = 0;
    black_white_c.width = 0;


    /* set up for creating the Gaussian blur image */
    var gau_c = document.getElementById("gaussian");
    gau_c.height = img.height
    gau_c.width = img.width
    var gau_ctx = gau_c.getContext("2d");
    var orig = imgData;


    /* create a Gaussian blur image */
    var FILTER_FESULT = Gaussian_filter(greek);

    for (y = FILTER_FESULT[2]; y < black_white_c.width - FILTER_FESULT[2]; y++) {
        for (x = FILTER_FESULT[2]; x < black_white_c.height - FILTER_FESULT[2]; x++) {
            var sum = 0;
            for (x1 = 0; x1 < FILTER_FESULT[1]; x1++)
                for (y1 = 0; y1 < FILTER_FESULT[1]; y1++)
                    sum += orig.data[4 * (y + y1 - FILTER_FESULT[2]) + 4 * (x + x1 - FILTER_FESULT[2]) * black_white_c.width] * FILTER_FESULT[0][x1 * FILTER_FESULT[2] + y1];
            for (color = 0; color < 3; color++)
                imgData.data[4 * y + 4 * x * black_white_c.width + color] = sum / FILTER_FESULT[3];

        }
    }

    gau_ctx.putImageData(imgData, 0, 0);
    document.getElementById("img_gaussian").src = gau_c.toDataURL();
    gau_c.height = 0
    gau_c.width = 0


    /* set up for creating the Sobel gradent image */
    var gra_c = document.getElementById("gradient");
    gra_c.height = img.height
    gra_c.width = img.width
    var gra_ctx = gra_c.getContext("2d");
    var orig = imgData;
    imgData = new ImageData(img.width, img.height);
    /* gradent filter for x */
    var kx = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ];
    /* gradent filter for y */
    var ky = [
        [1, 2, 1],
        [0, 0, 0],
        [-1, -2, -1]
    ];
    /* angle mapings */
    var angle_matrix = [[]]
    for (x = 1; x < img.height - 1; x++) {
        var list = [];
        for (y = 0; y < img.width; y++)
            list.push(0);
        angle_matrix.push(list)
    }
    var floats = [];
    /* set up for creating the Gaussian blur image */
    for (y = 3; y < img.width - 3; y++) {
        for (x = 3; x < img.height - 3; x++) {
            var sum_kx = 0;
            var sum_ky = 0;
            for (x1 = 0; x1 < 3; x1++)
                for (y1 = 0; y1 < 3; y1++) {
                    sum_kx += orig.data[4 * (y + y1) + 4 * (x + x1) * img.width] * kx[x1][y1];
                    sum_ky += orig.data[4 * (y + y1) + 4 * (x + x1) * img.width] * ky[x1][y1];
                }
            floats[x + y * img.height] = Math.sqrt(sum_kx * sum_kx + sum_ky * sum_ky);
            for (color = 0; color < 3; color++)
                imgData.data[4 * y + 4 * x * img.width + color] = Math.sqrt(sum_kx * sum_kx + sum_ky * sum_ky);
            //angle_matrix[x][y] = ((Math.atan2(sum_kx, sum_ky) / Math.PI * 180) + 180) % 180
        }
    }
    var max = 0;
    for (var i = 0; i < floats.length; i++) {
        if (floats[i] > max)
            max = floats[i];
    }
    // console.log(max)
    for (y = 0; y < img.width - 0; y++) {
        for (x = 0; x < img.height - 0; x++) {
            for (color = 0; color < 3; color++)
                imgData.data[4 * y + 4 * x * img.width + color] = floats[x + y * img.height] / max * 255;
            imgData.data[4 * y + 4 * x * img.width + 3] = 255
        }
    }

    // console.log(angle_matrix)

    gra_ctx.putImageData(imgData, 0, 0);
    document.getElementById("img_gradient").src = gra_c.toDataURL();
    gra_c.height = 0;
    gra_c.width = 0;


    /* set up for creating the Non-Maximum image */
    /*
    var Non_Maximum_c = document.getElementById("Non-Maximum");
    Non_Maximum_c.height = img.height
    Non_Maximum_c.width = img.width
    var Non_Maximum_ctx = Non_Maximum_c.getContext("2d");
    var orig = imgData;
    // create a Non-Maximum image 
    for (y = 1; y < Non_Maximum_c.width - 1; y++) {
        for (x = 1; x < Non_Maximum_c.height - 1; x++) {
            q = 255
            r = 255

            //angle 0
            if (0 <= angle_matrix[x][y] < 22.5 || 157.5 <= angle_matrix[x][y] <= 180) {
                q = orig.data[4 * y + 4 * (x + 1) * img.width]
                r = orig.data[4 * y + 4 * (x - 1) * img.width]
            }
            //angle 45
            else if (22.5 <= angle_matrix[x][y] < 67.5) {
                q = orig.data[4 * (y - 1) + 4 * (x + 1) * img.width]
                r = orig.data[4 * (y + 1) + 4 * (x - 1) * img.width]
            }
            //angle 90
            else if (67.5 <= angle_matrix[x][y] < 112.5) {
                q = orig.data[4 * (y + 1) + 4 * (x) * img.width]
                r = orig.data[4 * (y - 1) + 4 * (x) * img.width]
            }
            //angle 135
            else if (112.5 <= angle_matrix[x][y] < 157.5) {
                q = orig.data[4 * (y - 1) + 4 * (x - 1) * img.width]
                r = orig.data[4 * (y + 1) + 4 * (x + 1) * img.width]
            }

            if (orig.data[4 * y + 4 * x * img.width] >= q && orig.data[4 * y + 4 * x * img.width] >= r)
            
            for (color = 0; color < 3; color++)
                imgData.data[4 * y + 4 * x * img.width + color] = orig.data[4 * y + 4 * x * img.width]
            else
                for (color = 0; color < 3; color++)
                    imgData.data[4 * y + 4 * x * img.width + color] = 0
        }
    }

    Non_Maximum_ctx.putImageData(imgData, 0, 0);
    */

    var millis = Date.now() - start;

    console.log(`seconds elapsed = ${ Math.floor((Date.now() - start) / 1000)}`);
    alert(`seconds elapsed = ${ Math.floor((Date.now() - start) / 1000)}`)
}
function Gaussian_filter(sigma) {
    var n = (2 * Math.ceil(sigma)) + 1;
    var mean = Math.floor(n / 2.0);
    var kernel = []; // variable length array


    console.log(`gaussian_filter: kernel size ${n}, sigma= ${sigma}`)

    var c = 0;
    for (var i = 0; i < n; i++)
        for (var j = 0; j < n; j++) {
            kernel[c] = Math.exp(-1 * (Math.pow((i - mean), 2.0) +
                Math.pow((j - mean), 2.0)) / (2 * sigma * sigma))
                / (2 * Math.PI * sigma * sigma);
            c++;
        }
    var max = 0;
    for (var i = 0; i < n * n; i++) {
        max += kernel[i]
        //console.log(max, kernel[i])
    }
    //console.log(kernel);
    return [kernel, n, mean, max]
}
function previewFile() {
    var preview = document.querySelector('img'); //selects the query named img
    var file = document.querySelector('input[type=file]').files[0]; //sames as here
    var reader = new FileReader();

    reader.onloadend = function () {
        preview.src = reader.result;
    }

    if (file) {
        reader.readAsDataURL(file); //reads the data as a URL
    } else {
        preview.src = "";
    }
}
function async_step_1() {
    var img = document.getElementById("input");
    /* set up for creating the black and white image */
    var black_white_c = document.getElementById("black_white");
    black_white_c.height = img.height
    black_white_c.width = img.width
    var black_white_ctx = black_white_c.getContext("2d");

    black_white_ctx.drawImage(img, 0, 0);
    /* create a black and white image */
    var imgData = black_white_ctx.getImageData(0, 0, black_white_c.width, black_white_c.height);
    var i;
    var data = {
        "imgData": imgData,
        "size": {
            x: 100,
            y: 100
        },
        "pos": {
            x: 0,
            y: 0
        },

    }

    for (y = 0; y < data.imgData.height; y += data.size.y) {
        for (x = 0; x < data.imgData.width; x += data.size.x) {
            var myWorker = new Worker('worker/black_white.js');
            data.pos.x = x;
            data.pos.y = y;
            myWorker.postMessage(data)
            myWorker.onmessage = function (oEvent) {
                console.log('Worker said : ', oEvent.data);
                document.getElementById("black_white").getContext("2d").putImageData(oEvent.data.imgData, oEvent.data.y, oEvent.data.x);
            };
        }
    }
}
function async_step_2() {
    /* set up for creating the black and white image */
    var black_white_c = document.getElementById("black_white");
    var black_white_ctx = black_white_c.getContext("2d");

    var imgData = black_white_ctx.getImageData(0, 0, black_white_c.width, black_white_c.height);

    var gau_c = document.getElementById("gaussian");
    gau_c.height = black_white_c.height
    gau_c.width = black_white_c.width


    /* create a Gaussian blur image */
    var FILTER_FESULT = Gaussian_filter(greek);
    var data = {
        "imgData": imgData,
        "size": {
            x: 100,
            y: 100
        },
        "pos": {
            x: 0,
            y: 0
        },
        filter: FILTER_FESULT
    }

    for (y = 0; y < data.imgData.height; y += data.size.y) {
        for (x = 0; y < data.imgData.width; x += data.size.x) {
            var myWorker = new Worker('worker/gaussian.js');
            data.pos.x = x;
            data.pos.y = y;
            myWorker.postMessage(data)
            myWorker.onmessage = function (oEvent) {
                console.log('Worker said : ', oEvent.data);
                document.getElementById("gaussian").getContext("2d").putImageData(oEvent.data.imgData, oEvent.data.y, oEvent.data.x);
            };
        }
    }
}

var slider = document.getElementById("myRange");
var output = document.getElementById("demo");

slider.oninput = function () {
    greek = this.value;
    document.getElementById("gaussian_sigma").innerHTML = this.value
}

function test(oEvent) {
    var imgData = oEvent.data.imgData;

    var filter = oEvent.data.filter
    var max_x = oEvent.data.pos.x + oEvent.data.size.x;
    max_x = Math.min(max_x, imgData.height - filter[2])
    var max_y = oEvent.data.pos.y + oEvent.data.size.y;
    max_y = Math.min(max_y, imgData.width - filter[2])
    var min_x = oEvent.data.pos.x
    var min_y = oEvent.data.pos.y
    min_x = Math.max(filter[2], min_x)
    min_y = Math.max(filter[2], min_y)
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
                outimgData.data[4 * (y - min_y) + 4 * (x - min_x) * outimgData.width + color] = sum / filter[3]
            outimgData.data[4 * (y - min_y) + 4 * (x - min_x) * outimgData.width + 3] = 255
        }
    }
    console.log({
        imgData: outimgData,
        x: min_x,
        y: min_y
    });
};