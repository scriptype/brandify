function colorify (options) {
    "use strict"

    // Get elements.
    var imageCanvas = $("#image").get(0)

    // Create new image.
    var img = new Image()

    // Set new data url as source of image.
    img.src = options.list[options.current]["logoDataURL"]

    // Draw image to canvas.
    drawImage(img)

    function drawImage (image) {
        // Get image dimensions.
        var w = image.width,
            h = image.height

        // Make canvas dimensions same as image dimensions.
        // Image will just fit into canvas context.
        imageCanvas.width = w
        imageCanvas.height = h

        // Get context of canvas.
        var ctx = imageCanvas.getContext("2d")

        // Draw image.
        ctx.drawImage(image, 0, 0, w, h)

        // Gather color data.
        collectColors(ctx, w, h)
    }

    function collectColors (context, width, height) {
        // Get image data.
        var imageData = context.getImageData(0, 0, width, height).data

        // Process image data by steps.
        // As a single pixel consists of 4 values (RGBA), multiply step by 4.
        // So {n * 4} means {n} pixels.
        var step = options.step * 4

        // Opaque pixels holder.
        var opaquePixels = []

        // Iterate through data.
        // Increment index number by step.
        var i = 0
        for (i; i < imageData.length; i += step) {
            // ith element of data is the starting point of a new pixel.
            // So collect it and other 3 following it.
            var rgba = [
                imageData[i],     // R
                imageData[i + 1], // G
                imageData[i + 2], // B
                imageData[i + 3]  // A
            ]

            // If color is full opaque,
            if (rgba[3] === 255) {
                // Keep it.
                opaquePixels.push(rgba)
            }
        }

        // Common opaque pixels.
        var commonPixels = [], px

        var j = 0
        for (j; j < opaquePixels.length; j++) {
            px = opaquePixels[j]
            // Color exists in multiple places in image.
            if (isCommon(px, opaquePixels))
                commonPixels.push(px)
        }

        // Common, opaque and distinctive pixels holder.
        var differentPixels = []

        var k = 0
        for (k; k < commonPixels.length; k++) {
            px = commonPixels[k]
            // Color is clearly different.
            if (hasNoSimilar(px, differentPixels)) {
                differentPixels.push(px)
            }
        }

        // Map pixels to RGBA strings.
        var rgbaStrings = stringifyRgba(differentPixels)

        options.callback(rgbaStrings)
    }

    // Detect if a color have been seen in multiple places in image.
    function isCommon (rgba, pool) {
        var minCommonLimit = 5

        var samePixels = pool.filter(function(px) {
            return !calcColorDiff(rgba, px)
        })

        return samePixels.length > minCommonLimit
    }

    // Eliminate similar tones of a color.
    function hasNoSimilar (rgba, pool) {
        var different = true

        var i = 0
        for (i; i < pool.length; i++) {
            if (calcColorDiff(rgba, pool[i]) < options.diffLimit) {
                different = false
                break
            }
        }

        return different
    }

    function calcColorDiff(rgba1, rgba2) {
        // Return difference between two RGBA.
        return rgba1.map(function (value, index) {
            // Get absolute difference between RGBs.
            // i.e. [10, 50, 100, 255] - [0, 128, 90, 255] –> [10, 78, 10, 0]
            return Math.abs(value - rgba2[index])
        }).reduce(function (a, e) {
            // Get sum of 3 difference values. i.e. [10, 78, 10] –> 98
            return a + e
        })
    }

    // Transform an array of 4 valued arrays into an array of RGBA strings
    function stringifyRgba (pixelData) {
        return pixelData.map(function(e) {
            return "rgba(" +
                e[0] + "," + // R
                e[1] + "," + // G
                e[2] + "," + // B
                e[3] + ")"   // A
        })
    }

}