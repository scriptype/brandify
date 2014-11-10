(function(){

    // Color that will be looked for.
    var COLOR = {
            RGB: [0, 0, 0],
            HEX: "#000000"
        },
        ALL_BRANDS

    // Get brands.
    var req = new XMLHttpRequest()
    req.open("GET", "brands.json", true)
    req.onload = init
    req.send()

    function init() {
        // Keep all brands when loaded.
        ALL_BRANDS = JSON.parse(req.response)

        // Render all brands for initialization.
        render(ALL_BRANDS)

        // Attach event handlers.
        $(".filter input").on("change", rerender)
        $("#color-box").on("keyup", rerender)
    }

    function render(brands) {
        var brandTemplate = Handlebars.compile($("#brand-template").html()),
            $target = $(".brands-container"),
            $header = $("header"),
            html = brandTemplate(brands)

        // Render brands.
        $target.html(html)

        // Change the color of bar.
        $header.css("background", COLOR["HEX"])

        // Reset slider values.
        $("#red").val(COLOR["RGB"][0])
        $("#green").val(COLOR["RGB"][1])
        $("#blue").val(COLOR["RGB"][2])

        // Reset input's value.
        $("#color-box").val(COLOR["HEX"])
    }

    function rerender(event) {
        // Get the value of sliders or input, depending on which one was changed.
        var isSlider = $(event.currentTarget).closest("label").hasClass("slider")
        if (isSlider) {
            // Get sliders' values.
            var RGB = [
                $("input#red").val(),
                $("input#green").val(),
                $("input#blue").val()
            ]
            COLOR.RGB = RGB
            COLOR.HEX = toHex(RGB)
        } else {
            // Get input's value.
            var colorValue = $("#color-box").val()
            COLOR.HEX = colorValue
            COLOR.RGB = toRGB(colorValue)
        }
        // Filter by new color.
        var filteredBrands = filterBrands(COLOR["HEX"])
        // Render brands.
        render(filteredBrands)
    }

    // Turn RGB array into an hexadecimal string. i.e. [255, 0, 128] –> #ff0080
    function toHex(RGB) {
        return "#" + RGB.map(function (e) {
            return ("0" + parseInt(e).toString(16)).slice(-2)
        }).join("")
    }

    // Turn hex into RGB array. i.e. #ff0080 –> [255, 0, 128]
    function toRGB(HEX) {
        // Remove hash from beginning.
        HEX = HEX.slice(1)
        return [
            HEX.slice(0, 2),// R as HEX
            HEX.slice(2, 4),// G as HEX
            HEX.slice(4, 6) // B as HEX
        ].map(function(e) {
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
        for (brand in ALL_BRANDS) {
            if (ALL_BRANDS.hasOwnProperty(brand)) {
                // Save as a variable for easy-access.
                var brandColors = ALL_BRANDS[brand]["colors"],
                    i = 0
                // Check each color of brand.
                for (i; i < brandColors.length; i++) {
                    // If color has acceptable or no difference from user input,
                    if (calcColorDiff(brandColors[i], HEX) <= limit) {
                        // Keep brand for render.
                        filteredBrands.push(ALL_BRANDS[brand])
                        // Stop iterating colors of same brand.
                        break
                    }
                }
            }
        }

        return filteredBrands
    }

    function calcColorDiff(color1, color2) {
        // Return difference between two colors.
        return toRGB(color1).map(function (value ,index) {
                // Get absolute difference between RGB's.
                // i.e. [10, 50, 100] - [0, 128, 90] –> [10, 78, 10]
                return Math.abs(value - toRGB(color2)[index])
            }).reduce(function (a, e) {
                // Get sum of 3 difference values. i.e. [10, 78, 10] –> 98
                return a + e
            })
    }

})()