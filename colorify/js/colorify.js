(function(){
    "use strict";

    // Get elements.
    var $input       = $("#receiver"),
        $loading     = $(".loading"),
        $info        = $(".info"),
        imageCanvas  = $("#image").get(0),
        resultCanvas = $("#result").get(0),
        $resultTitle = $("#result-text"),
        $fileTitle   = $("#file-text")

    var defaultInfoText = $info.text()
    // When a file selected.
    $input.on("change", function() {
        // Get file.
        var file = $input.get(0).files[0]

        // Happens when input had has a value then changed to nothing.
        if (!file)
            return

        // When some crazy file format is tried.
        if (!file.type.match("image")) {
            toggleInfo("Also don't try file types other than image.", true)
            return
        }

        // Reset info text.
        toggleInfo(defaultInfoText, false)

        // Show loading indicator.
        $loading.show()

        // Set file header.
        $fileTitle.text(file.name)

        // Get an instance of FileReader.
        var reader = new FileReader()

        // Read file as data URL.
        reader.readAsDataURL(file)

        // When reading is completed.
        reader.onload = function () {
            // Create new image.
            var img = new Image()

            // Set source as new data url.
            img.src = reader.result

            // Draw image to canvas.
            drawImage(img)
        }
    })

    function drawImage (image) {
        // Get image dimensions.
        var w = image.width,
            h = image.height

        // Limit canvas size to 500px
        // Scale image dimensions to width being 500px.
        if (w > 500) {
            var ratio = w / 500
            w = 500
            h = Math.round(h / ratio)
        }

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
        var step = 10 * 4

        // Unique pixels data.
        var uniquePixels = []

        // Iterate through data.
        // Increment index number by step.
        var i = 0
        for (i; i < imageData.length; i += step) {
            // ith element of data is the starting point of a new pixel.
            // So collect it and other 3 following it.
            var RGBA = [
                imageData[i],     // R
                imageData[i + 1], // G
                imageData[i + 2], // B
                imageData[i + 3]  // A
            ]
            // If this is the first instance of this color,
            if (isUnique(RGBA, uniquePixels))
                // Keep it.
                uniquePixels.push(RGBA)
        }

        // Map uniquePixels to RGBA values.
        var uniqueRGBAs = makeRGBA(uniquePixels)

        // Show colors in result canvas.
        visualizeColors(uniqueRGBAs)
    }

    // Detect if RGBA array is a member of another big array of arrays.
    // Nifty stringify trick.
    function isUnique (RGBA, pool) {
        return pool.map(function(e) {
            return JSON.stringify(e)
        }).indexOf(JSON.stringify(RGBA)) === -1
    }

    // Transform an array of 4 valued arrays into an array of RGBA strings
    function makeRGBA (pixelData) {
        return pixelData.map(function(e) {
            return "rgba(" +
                e[0] + "," + // R
                e[1] + "," + // G
                e[2] + "," + // B
                e[3] + ")"   // A
        })
    }

    function visualizeColors (colors) {
        // Get result canvas dimensions.
        var w = resultCanvas.width,
            h = resultCanvas.height

        // Get context.
        var ctx = resultCanvas.getContext("2d")

        // Reset context.
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, w, h)

        // Set initial values of x and y
        var x = 0,
            y = 0

        // Width and height of each square.
        // step^2 * colors.length === w * h
        var step = Math.sqrt(w * h / colors.length)

        // Iterate through colors.
        var i = 0
        for (i; i < colors.length; i++) {
            // If end of line, skip to next line.
            if (x > w) {
                x = 0
                y += step
            }

            // Set square color.
            ctx.fillStyle = colors[i]

            // Draw square.
            ctx.fillRect(x, y, step, step)

            // Move to next square position.
            x += step
        }

        // Show the result.
        $(resultCanvas).show()

        // Hide loading indicator.
        $loading.hide()

        // Show result headings.
        $fileTitle.show()
        $resultTitle.show()
    }

    function toggleInfo (text, isError) {
        // Disappear, then appear with a different text.
        $info.fadeOut(300, function () {
            $info.text(text)
            // Errorrrorroooorroororo...
            if (isError)
                $info.addClass("error")
            else
                $info.removeClass("error")
            $info.fadeIn(300)
        })
    }

})()