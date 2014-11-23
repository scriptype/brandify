(function() {
    "use strict"

    // SET GLOBALS.
    // UI variables.
    var brandsTemplate = Handlebars.compile($("#brands-template").html()),
        settingsTemplate = Handlebars.compile($("#settings-template").html()),
        currentBrandNumber = 0,
        brandList, data, UxVerb

    // Get elements.
    var imageCanvas = $("#image").get(0),
        $brandList = $("#brand-list"),
        $result = $(".result"),
        $settings = $(".settings"),
        $startInfo   = $("#start-info"),
        $startButton = $("#start")

    // Timers.
    var countDown = seconds(2),
        waitTime = seconds(2),
        timer, _timer

    // Settings.
    var settings = {
        file: {
            description: "Data source",
            value: "brands.json"
        },
        diffLimit: {
            description: "Minimum difference",
            value: 64
        },
        step: {
            description: "Read per (pixels)",
            value: 20
        },
        output: {
            description: "Output format",
            value: "hex"
        },
        get: function (prop) {
            return this[prop].value
        }
    }

    // GET DATA.
    var req = new XMLHttpRequest()
    req.open("GET", settings.get("file"), true)
    req.onload = init
    req.send()

    // Data is ready.
    function init () {
        // Save brands.
        data = JSON.parse(req.responseText)

        // Save brand list without dataURLs for template.
        brandList = data.map(function (b) {
            return {
                name: b.name,
                status: "normal"
            }
        })

        // Initialize brand list.
        renderBrandList()

        // Show settings.
        renderSettings()

        // "start" or "continue" depending on situation.
        UxVerb = "start"

        // Status idle feedback.
        info("normal")

        // Show starter button.
        $startButton.show()
            .on("click", start)
    }

    function renderBrandList () {
        $brandList.html(brandsTemplate(brandList))
    }

    function renderSettings () {
        // Exclude getter function with a cheap trick.
        var UiSettings = JSON.parse(JSON.stringify(settings))
        // Render.
        $settings.html(settingsTemplate(UiSettings))
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
                callback(currentBrandNumber++)
            }, ms)
        }
    }

    // Colorify high-order.
    function processBrand (currentNumber) {

        // Run colorify with params and options.
        colorify({
            data: data,
            index: currentNumber,
            step: settings.get("step"),
            diffLimit: settings.get("diffLimit"),
            output: settings.get("output"),
            canvas: imageCanvas,
            callback: function (colors) {
                $(imageCanvas).filter(":hidden").show()

                // Feedback.
                info("ongoing")

                // Continue until finish.
                if (currentNumber + 1 < data.length)
                    setTimeout(start, waitTime)
                else
                    info("finish")

                // Set colors of current brand.
                data[currentNumber].colors = colors

                // Show result data.
                result()
            }
        })
    }

    function result () {
        // Get processed brands.
        var completedBrands = data.slice(0, currentBrandNumber)
        // Stringify and show data.
        $result.find(".json")
            .text(JSON.stringify(completedBrands, null, "  "))
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
                $startInfo.text(currentBrandNumber + " / " + data.length + " brands completed.")
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
                    .text(currentBrandNumber + " / " + data.length)

                // Set all previous brands as completed.
                var i = 0
                for (i; i < currentBrandNumber; i++) {
                    brandList[i].status = "completed"
                }

                // Re-render brand list.
                renderBrandList()

                break

            case "processing":
                // Current brand info.
                $startInfo.text(data[currentBrandNumber].name)

                // Find current brands.
                var j = 0
                for (j; j < brandList.length; j++) {
                    // Set current brand as ongoing.
                    if (brandList[j].name === data[currentBrandNumber].name)
                        brandList[j].status = "ongoing"
                }

                // Re-render brand list.
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

    function seconds (sec) {
        return sec * 1000
    }

})()