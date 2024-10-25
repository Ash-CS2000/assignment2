function init(){
    var w = 800;
    var h = 600;
    var margin = { top: 30, right: 70, bottom: 80, left: 70 };
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;
    let defaultYear = "2020";

    // Display default chart with year 2020
    updateChart(defaultYear);

    //reset function
    document.getElementById("reset").onclick = function(){
        let title = document.getElementById("title");
        let error = document.getElementById("error");
        title.innerHTML = `Carbon Dioxide Emission from OECD Countries in 2020`;
        error.style.display = "none";
        updateChart(defaultYear);
    }

    
    // Select button functionality for default chart
    document.getElementById("select").onclick = function() {
        let year = document.getElementById("year").value || defaultYear;
        let error = document.getElementById("error");

        error.style.display = "none"; // Hide error message initially

        title.innerHTML = `Carbon Dioxide Emission from OECD Countries in ${year}`; // Update title

        if (!isValidYear(year)) {
            error.innerHTML = `Please enter the year between 2000 - 2024`;
            error.style.display = "flex";
            error.style.justifyContent = "center";
            error.style.alignItems = "center";
            return; // Stop execution if validation fails
        }

        // Update chart with only the main year
        updateChart(year);
    };



    // Compare button to trigger the comparison
    document.getElementById("compare").onclick = function() {
        let compareYear = document.getElementById("compareyear").value;
        let year = document.getElementById("year").value || defaultYear;
        let error = document.getElementById("error");

        error.style.display = "none"; // Hide error message initially
        
        title.innerHTML = `Carbon Dioxide Emission Comparison: ${year} vs ${compareYear}`; // Update the title

        // Validate both years
        if (!isValidYear(year) || !isValidYear(compareYear)) {
            error.innerHTML = `Please enter valid years between 2000 - 2024 for comparison`;
            error.style.display = "flex";
            error.style.justifyContent = "center";
            error.style.alignItems = "center";
            return; // Stop execution if validation fails
        }

        // Update the chart with both years
        updateChart(year, compareYear);
    };

    // Function to validate the year
    function isValidYear(year) {
        const yearNumber = parseInt(year, 10);
        return yearNumber >= 2000 && yearNumber <= 2020 && !isNaN(yearNumber);
    }

    // Update chart according to input years
    function updateChart(year, compareYear = null) {
        d3.select("#chart1").html(""); // Reset the chart

        d3.csv("Firstbarchart.csv").then(function(data) {
            const processedData = data.map(d => {
                return {
                    country: d["Country Name"],  // "Country Name" column
                    yearData: +d[year] || 0,     // Data for the main year
                    number: +d[year] || 0,
                    compareData: compareYear ? (+d[compareYear] || 0) : null  // Data for comparison year
                };
            });

            console.table(processedData, ["country", "yearData", "compareData", "number"]);

            BarChart(processedData, compareYear);
        });
    }

    // Create bar chart with or without grouped bars for comparison
    function BarChart(data, compareYear) {
        var svg = d3.select("#chart1")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        var x0Scale = d3.scaleBand()
            .domain(data.map(d => d.country))  // Each country
            .range([0, width])
            .padding(0.2);  // Space between country groups

        var x1Scale = d3.scaleBand()  // To place bars within each country group when comparing
            .domain(['yearData', 'compareData'])
            .range([0, x0Scale.bandwidth()])
            .padding(0.05);  // Small padding between bars

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(d.yearData, d.compareData))])             
            .range([height, 0]);
            

        var groups = svg.selectAll(".country-group")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "country-group")
            .attr("transform", function(d) { return "translate(" + x0Scale(d.country) + ",0)"; });

        // Initially draw only one bar per country
        groups.selectAll("rect")
            .data(d => [
                { key: "yearData", value: d.yearData, compare: false },
                { key: "compareData", value: d.compareData, compare: true }
            ])
            .enter()
            .filter(d => d.compare === false || compareYear !== null)  // Only add compare bars if compareYear is provided
            .append("rect")
            .attr("x", function(d) {
                return x1Scale(d.key);  // Position within the country group for compareData
            })
            .attr("y", d => yScale(d.value))
            .attr("width", function(d) {
                return compareYear ? x1Scale.bandwidth() : x0Scale.bandwidth();
            })
            .attr("height", d => height - yScale(d.value))
            .attr("fill", d => d.key === "yearData" ? "#69b3a2" : "orange")
            .on("mouseover", function(event, d) {
                // Change the color of the bar on mouseover
                d3.select(this)
                    .attr("fill", "red");

                // Get the position of the hovered bar
                var xPosition = parseFloat(d3.select(this).attr("x"));
                console.log(xPosition);
                var yPosition = parseFloat(d3.select(this).attr("y"));
                    
                // Update tooltip text
                svg.append("text")
                    .attr("id", "tooltip")
                    .attr("x", xPosition - 70)
                    .style("font-size", "0.8em")
                    .style("fill", "red")
                    .attr("y", yPosition + 15)
                    .text(d.value); 
            })
            .on("mouseout", function() {
                // Reset the bar color on mouseout
                d3.select(this)
                    .attr("fill", d => d.key === "yearData" ? "#69b3a2" : "orange");
    
                // Hide the tooltip
                d3.select("#tooltip").remove();
            });
        

        
        // Add Y-axis
        svg.append("g")
            .call(d3.axisLeft(yScale));

        // Add X-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0Scale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em");

        // X Axis Label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text("Country");

        // Y Axis Label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 15)
            .text("Value (MTCO2e)");
    }

    
}

window.onload = init;