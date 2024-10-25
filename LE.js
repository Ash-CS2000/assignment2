function init(){
    const margin = { top: 50, right: 50, bottom: 50, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;


    // Set up the SVG
    const svg = d3.select("#chart2")
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Load the CSV file
    d3.csv("largest-emission.csv").then(function(data) {
        // Parse the data (Assuming the year columns are from 1960 to 2023)
        const years = d3.range(2000, 2020); // years from 2000 to 2020
        const parsedData = data.map(d => ({
            country: d["Country Name"],
            emissions: years.map(year => +d[year] || 0) // Convert year columns to numbers
        }));
        

        const colorScale = d3.scaleOrdinal()
                             .domain(parsedData.map(d => d.country))
                             .range(parsedData.map(d => {
                                 if (d.country === "SomeSpecificCountry") {
                                     return "red"; // Assign red for a specific country
                                 } else {
                                     return d3.schemeCategory10[parsedData.indexOf(d) % 10]; // Otherwise use the default scheme
                                 }
                             }));

        // Set up scales
        const xScale = d3.scaleLinear()
                         .domain([2000, 2020])
                         .range([0, width]);

        const yScale = d3.scaleLinear()
                         .domain([0, d3.max(parsedData, d => d3.max(d.emissions))])
                         .range([height, 0]);

        // Define the line generator
        const line = d3.line()
                       .x((d, i) => xScale(2000 + i)) // X is based on year
                       .y(d => yScale(d)); // Y is based on emissions

        // Set up axes
        svg.append("g")
           .attr("transform", `translate(0, ${height})`)
           .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

        svg.append("g")
           .call(d3.axisLeft(yScale));

        // X Axis Label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text("Year");

        // Y Axis Label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 15)
            .text("Value (MTCO2e)");


        // Tooltip div for showing emissions
        const tooltip = d3.select("body").append("div")
                          .attr("class", "tooltip")
                          .style("position", "absolute")
                          .style("background", "#f9f9f9")
                          .style("padding", "5px")
                          .style("border", "1px solid #d3d3d3")
                          .style("border-radius", "5px")
                          .style("visibility", "hidden");


        // Draw the line for each country
        parsedData.forEach(countryData => {
            svg.append("path")
               .datum(countryData.emissions)
               .attr("class", "line")
               .attr("d", line)
               .style("stroke", colorScale(countryData.country));

            // Draw circles at each data point
            svg.selectAll(".circle")
               .data(countryData.emissions)
               .enter()
               .append("circle")
               .attr("cx", (d, i) => xScale(2000 + i))
               .attr("cy", d => yScale(d))
               .attr("r", 1.7)
               .style("stroke", "colorScale(countryData.country)")
               .on("mouseover", function(event, d){
                d3.select(this)
                     .transition()
                     .duration(100)
                     .attr("r", 6); // Enlarge the circle on hover

                // Get mouse position
                const [x, y] = d3.pointer(event);

                // Show the tooltip with the emissions value at the circle's position
                tooltip.attr("x", d3.select(this).attr("cx"))
                    .attr("y", d3.select(this).attr("cy") - 10) // Slightly above the point
                    .text(`Emissions: ${d.toFixed(2)} MTCO2e`)
                    .style("visibility", "visible");
               })
               .on("mousemove", function(event){
                // Update tooltip position when the mouse moves
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 20) + "px");
                })
               .on("mouseout", function() {
                    d3.select(this)
                        .transition()
                        .duration(100)
                        .attr("r", 1.7); // Reset the circle size

                    // Hide the tooltip
                    tooltip.style("visibility", "hidden");
                });
        });

        // Add the legend on the top right
        const legend = svg.append("g")
                          .attr("class", "legend")
                          .attr("transform", `translate(${width - 24}, 0)`); // Position it on the right side

        // Add colored rectangles and text for each country
        parsedData.forEach((countryData, i) => {
            const legendRow = legend.append("g")
                                    .attr("transform", `translate(0, ${i * 20})`);
                                    

            // Add colored rectangle
            legendRow.append("rect")
                     .attr("width", 10)
                     .attr("height", 10)
                     .attr("fill", colorScale(countryData.country));

            // Add country name text
            legendRow.append("text")
                     .attr("x", 10)
                     .attr("y", 10)
                     .attr("text-anchor", "start")
                     .style("font-size", "12px")
                     .text(countryData.country);
        });

    }).catch(function(error) {
        console.error("Error loading the CSV file:", error);
    });
}
window.onload = init;