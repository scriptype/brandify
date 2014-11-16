(function() {
    "use strict"

    // Set globals.
    var brandsTemplate = Handlebars.compile($("#brands-template").html()),
        brandList, currentBrandNumber = 0,
        $brandList = $("#brand-list"),
        $result = $(".result"),
        $settings = $(".settings"),
        imageCanvas = $("#image").get(0),
        countDown = seconds(2),
        waitTime = seconds(2),
        diffLimit = 64,
        step = 20,
        brands, timer, _timer, UxVerb

    // Get brands.
    var req = new XMLHttpRequest()
    req.open("GET", "brands.json", true)
    req.onload = init
    req.send()

    // Get elements.
    var $startInfo   = $("#start-info"),
        $startButton = $("#start")

    function init () {
        // Save brands.
        brands = JSON.parse(req.responseText)

        // Save brand list without dataURLs for template.
        brandList = brands.map(function (b) {
            return {
                name: b.name,
                status: "normal"
            }
        })

        // Initialize brand list.
        renderBrandList(brandList)

        // "start" or "continue" depending on situation.
        UxVerb = "start"

        // Status idle feedback.
        info("normal")

        // Show starter button.
        $startButton.show()
            .on("click", start)

        // Show settings.
        $settings.find("#diff-limit span").text(diffLimit)
        $settings.find("#step span").text(step)
    }

    function renderBrandList () {
        $brandList.html(brandsTemplate(brandList))
    }

    function start (event) {
        // Toggle button role if clicked by user.
        if (event)
            $startButton.toggleClass("cancel")

        // Update UxText
        UxVerb = currentBrandNumber > 0 ?
            "continue" : "start"

        // Start cancellable countdown to main process.
        timeOut(processBrand, countDown)
    }

    function timeOut (callback, ms) {
        // If button have cancel class, it's clicked to start process.
        var cancel = !$startButton.hasClass("cancel")

        if (cancel) {
            // Stop and get back to normal.
            clearInterval(timer)
            info("normal")
        } else {
            // Feedback of countdown.
            info("cancellable", ms)

            // Start cancellable countdown.
            timer = setTimeout(function() {
                // Final function.
                callback(brands, currentBrandNumber++)
            }, ms)
        }
    }

    // Feedback for user.
    function info (type, param) {
        // Stop the countdown.
        clearInterval(_timer)

        switch (type) {
            case "normal":
                // Return button back to initial state.
                $startButton.text(UxVerb + " processing")
                    .removeClass("cancel")
                    .prop("disabled", false)

                // Return info-text back to initial state.
                $startInfo.text(currentBrandNumber + " / " + brands.length + " brands completed.")
                    .addClass("success")
                    .removeClass("warning")
                break

            case "cancellable":
                // Switch info text style.
                $startInfo.toggleClass("warning", "success")
                    .text("Processing will " + UxVerb +
                    " in " + (param / 1000) + " seconds.")

                // Button text.
                $startButton.text("Cancel")

                // Change info-text every seconds, to inform users about
                // how much time they have before process starts.
                _timer = setInterval(function () {
                    param -= 1000
                    if (param - 1000)
                        // Processing will start.
                        $startInfo.text("Processing will " + UxVerb +
                            " in " + (param / 1000) + " seconds.")
                    else
                        // Processing started feedback.
                        info("processing")

                }, seconds(1))

                break

            case "ongoing":
                // Switch info text style.
                $startInfo.toggleClass("warning", "success")
                    // Remaining brand info.
                    .text(currentBrandNumber + " / " + brands.length)

                var i = 0

                for (i; i < currentBrandNumber; i++) {
                    brandList[i].status = "completed"
                }

                renderBrandList()

                break

            case "processing":
                // Current brand info.
                $startInfo.text(brands[currentBrandNumber].name)

                var j = 0

                for (j; j < brandList.length; j++) {
                    if (brandList[j].name === brands[currentBrandNumber].name)
                        brandList[j].status = "ongoing"
                }

                renderBrandList()
                break

            case "finish":
                // Return button back to initial state.
                $startButton.text("finished processing")
                    .removeClass("cancel")
                    .prop("disabled", true)
                break

        }
    }

    // Colorify high-order.
    function processBrand (brandList, currentNumber) {

        // Run colorify with params and options.
        colorify({
            canvas: imageCanvas,
            list: brandList,
            current: currentNumber,
            step: step,
            diffLimit: diffLimit,
            callback: function (rgbaList) {
                $(imageCanvas).filter(":hidden").show()

                // Feedback.
                info("ongoing")

                // Continue until finish.
                if (currentNumber + 1 < brands.length) {
                    setTimeout(start, waitTime)
                } else {
                    info("finish")
                }

                brands[currentNumber].colors = rgbaList

                result()
            }
        })
    }

    function result () {
        var completedBrands = brands.slice(0, currentBrandNumber)
        $result.find(".json")
            .text(JSON.stringify(completedBrands, null, "  "))
    }

    function seconds (sec) {
        return sec * 1000
    }
})()