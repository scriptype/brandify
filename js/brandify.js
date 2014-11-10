(function(){

    // Color that will be looked for.
    var color = {
            RGB: [0, 0, 0],
            HEX: "#000000"
        },
        allBrands

    // Get brands.
    var req = new XMLHttpRequest()
    req.open("GET", "brands.json", true)
    req.onload = init
    req.send()

    function init() {
        // Keep all brands when loaded.
        allBrands = JSON.parse(req.response)

        // Render all brands for initialization.
        render(allBrands)

        // Attach event handlers.
        $(".filter input").on("change", slideHandler)
        $("#color-box").on("keyup", inputBoxHandler)
    }

    function render(brands) {
        var brandTemplate = Handlebars.compile($("#brand-template").html()),
            $target = $(".brands-container"),
            $header = $("header"),
            html = brandTemplate(brands)

        // Render brands.
        $target.html(html)

        // Change the color of bar.
        $header.css("background", color["HEX"])

        // Reset slider values.
        $("#red").val(color["RGB"][0])
        $("#green").val(color["RGB"][1])
        $("#blue").val(color["RGB"][2])

        // Reset input's value.
        $("#color-box").val(color["HEX"])
    }

    function slideHandler (ev) {
        // Get sliders' values.
        var RGB = [
            $("input#red").val(),
            $("input#green").val(),
            $("input#blue").val()
        ]

        // Change color.
        color.RGB = RGB
        color.HEX = toHex(RGB)

        rerender()
    }

    function inputBoxHandler (ev) {
        if (   ev.keyCode === 91 || ev.keyCode === 93
            || ev.keyCode === 16 || ev.keyCode === 17 || ev.keyCode === 18
            || ev.keyCode === 37 || ev.keyCode === 38
            || ev.keyCode === 39 || ev.keyCode === 40)
            return
        // Do nothing on non-effective keys.

        // Get input's value.
        var colorValue = $("#color-box").val()

        // Change color.
        color.HEX = colorValue
        color.RGB = toRGB(colorValue)

        rerender()
    }

    function rerender() {
        // Filter by new color.
        var filteredBrands = filterBrands(color["HEX"])
        // Render brands.
        render(filteredBrands)
    }

    // Turn RGB array into an hexadecimal color value. i.e. [255, 0, 128] –> #ff0080
    function toHex(RGB) {
        return "#" + RGB.map(function (e) {
            return ("0" + parseInt(e).toString(16)).slice(-2)
        }).join("")
    }

    // Turn HEX into RGB array. i.e. #ff0080 –> [255, 0, 128]
    function toRGB(HEX) {
        var RGB

        // Remove hash from beginning.
        HEX = HEX.slice(1)

        // If HEX is shortened like #f08, duplicate each character.
        if (HEX.length === 3) {
            RGB = [
                HEX.slice(0, 1) + HEX.slice(0, 1),// R as HEX
                HEX.slice(1, 2) + HEX.slice(1, 2),// G as HEX
                HEX.slice(2, 3) + HEX.slice(2, 3) // B as HEX
            ]
        } else {
            RGB = [
                HEX.slice(0, 2),// R as HEX
                HEX.slice(2, 4),// G as HEX
                HEX.slice(4, 6) // B as HEX
            ]
        }

        // Return value as an array of integers.
        return RGB.map(function(e) {
            return parseInt(e, 16)
        })
    }

    function filterBrands(HEX) {
        // Prepare results.
        var filteredBrands = [],
        // Difference limit.
            limit = 128

        // Check each brand.
        var brand
        for (brand in allBrands) {
            if (allBrands.hasOwnProperty(brand)) {
                // Save as a variable for easy-access.
                var brandColors = allBrands[brand]["colors"],
                    i = 0
                // Check each color of brand.
                for (i; i < brandColors.length; i++) {
                    // If color has acceptable or no difference from user input,
                    if (calcColorDiff(brandColors[i], HEX) <= limit) {
                        // Keep brand for render.
                        filteredBrands.push(allBrands[brand])
                        // Stop iterating colors of same brand.
                        break
                    }
                }
            }
        }

        return filteredBrands
    }

    function calcColorDiff(hex1, hex2) {
        // Return difference between two HEXs.
        return toRGB(hex1).map(function (value ,index) {
                // Get absolute difference between RGB's.
                // i.e. [10, 50, 100] - [0, 128, 90] –> [10, 78, 10]
                return Math.abs(value - toRGB(hex2)[index])
            }).reduce(function (a, e) {
                // Get sum of 3 difference values. i.e. [10, 78, 10] –> 98
                return a + e
            })
    }

})()