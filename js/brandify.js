(function(){

    "use strict";

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
        allBrands = JSON.parse(req.responseText)

        // Sort brands alphabetically.
        allBrands.sort(function (a, e) {
            return a.name > e.name ? 1
                : (a.name < e.name ? -1 : 0)
        })

        // Render all brands for initialization.
        render(allBrands)
    }

    // Reset event handlers.
    function propagateEvents() {
        // Sliders
        $(".filter input").off("change")
            .on("change", eventSlide)
        // HEX input
        $("#color-box").off("keyup")
            .on("keyup", eventKeyUp)
        // Brand color-list
        $(".color-list li").off("click")
            .on("click", eventClick)
    }

    function render(brands) {
        var brandTemplate = Handlebars.compile($("#brand-template").html()),
            $target = $(".brands-container"),
            $header = $("header"),
            html = brandTemplate(brands)

        // Render brands.
        $target.html(html)

        // Re-attach events as DOM is reset.
        propagateEvents()

        // Reset slider values.
        $("#red").val(color.RGB[0])
        $("#green").val(color.RGB[1])
        $("#blue").val(color.RGB[2])

        // Reset input's value.
        $("#color-box").val(color.HEX)

        // Change the color of bar.
        $header.css("background", color.HEX)

        // If color is bright, tell header this.
        if (isLight(color.RGB))
            $header.addClass("light")
        else
            $header.removeClass("light")
    }

    function eventSlide () {
        // Get sliders' values.
        var RGB = [
            parseInt($("input#red").val()),
            parseInt($("input#green").val()),
            parseInt($("input#blue").val())
        ]

        // Change color.
        color.RGB = RGB
        color.HEX = toHex(RGB)

        reRender()
    }

    function eventKeyUp (ev) {
        // Do nothing on non-effective keys.
        if (   ev.keyCode === 91 || ev.keyCode === 93
            || ev.keyCode === 16 || ev.keyCode === 17 || ev.keyCode === 18
            || ev.keyCode === 37 || ev.keyCode === 38
            || ev.keyCode === 39 || ev.keyCode === 40)
            return

        // Get input's value.
        var colorValue = $("#color-box").val()

        // Change color.
        color.HEX = colorValue
        color.RGB = toRGB(colorValue)

        reRender()
    }

    function eventClick (ev) {
        // Get HEX from data-color attribute.
        var colorValue = $(ev.currentTarget).data("color")

        // Change color.
        color.HEX = colorValue
        color.RGB = toRGB(colorValue)

        reRender()
    }

    function reRender() {
        // Filter by new color.
        var brandsFiltered = filterBrands(color.HEX),
        // Sort by relevance.
            brandsSorted = sortBrands(brandsFiltered)

        // Render brands.
        render(brandsSorted)
    }

    function filterBrands(HEX) {
        // Prepare results.
        var filteredBrands = [],
        // Difference limit.
            limit = 64

        // Check each brand.
        var brand
        for (brand in allBrands) {
            if (allBrands.hasOwnProperty(brand)) {
                // Save color list for easy-access.
                var brandColors = allBrands[brand]["colors"],
                    i = 0
                // Check each color of brand.
                for (i; i < brandColors.length; i++) {
                    // Difference of color.
                    var colorDiff = calcColorDiff(brandColors[i], HEX)
                    // If color has acceptable or no difference from user input,
                    if (colorDiff <= limit) {
                        // Push brand and diff value.
                        filteredBrands.push({
                            brand: allBrands[brand],
                            diff: colorDiff
                        })
                        // Stop iterating colors of same brand.
                        break
                    }
                }
            }
        }

        return filteredBrands
    }

    function sortBrands (brandsList) {
        return brandsList.sort(function (a, e) {
                // Sort brands by diff value being minimum.
                return e.diff < a.diff
            }).map(function(e) {
                // Reduce object to brand-level for rendering.
                return e.brand
            })
    }

    function calcColorDiff(hex1, hex2) {
        // Return difference between two HEXs.
        return toRGB(hex1).map(function (value, index) {
            // Get absolute difference between RGBs.
            // i.e. [10, 50, 100] - [0, 128, 90] –> [10, 78, 10]
            return Math.abs(value - toRGB(hex2)[index])
        }).reduce(function (a, e) {
            // Get sum of 3 difference values. i.e. [10, 78, 10] –> 98
            return a + e
        })
    }

    // Turn RGB array into a HEX color. i.e. [255, 0, 128] –> #ff0080
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

    function isLight (RGB) {
        // Is R+G+B > 640?
        var bright = 640 < RGB.reduce(function (a, e) {
                return a + e
            }),
            // Is R+G > 480
            yellowIsh = RGB[0] + RGB[1] > 480

        // It's a light color if it's bright or yellow-ish.
        return bright || yellowIsh
    }

})()