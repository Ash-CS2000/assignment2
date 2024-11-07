function init() {
    // Set dimensions for the SVG canvas
    const width = 960;
    const height = 500;

    // Select the #chart5 div and append an SVG element
    const svg = d3.select("#chart5")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

        // Create a tooltip div and style it
    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("position", "absolute")
                        .style("background-color", "white")
                        .style("border", "1px solid #ccc")
                        .style("padding", "8px")
                        .style("border-radius", "4px")
                        .style("pointer-events", "none")
                        .style("display", "none");

    // Define a color scale
    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, 1]); // Adjust domain based on CO₂ intensity values in your data (update if values exceed 1)

    // Load and process data
    Promise.all([
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), // World GeoJSON data
        d3.csv("Worldmap.csv", d => ({
            Country: d["Country"], // Assuming this is the 'Country' column in the file without headers
            Code: d["Code"],            // Assuming this is the 'Code' column
            Year: +d["Year"],          // Assuming this is the 'Year' column
            Value: +d["Value"]   // Assuming this is the 'Value' column
        }))
    ]).then(([geoData, csvData]) => {
        console.log(csvData);
        
        // Create a dictionary of CO₂ intensity by country code
        const intensityData = {};
        csvData.forEach(d => {
            intensityData[d.Code] = d.Value;
        });

        // Define the map projection
        const projection = d3.geoMercator()
            .scale(130)
            .translate([width / 2, height / 1.5]);

        // Define the path generator
        const path = d3.geoPath().projection(projection);

        // Draw the map
        svg.selectAll("path")
            .data(geoData.features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "country")
            .attr("fill", d => {
                const intensity = intensityData[d.id]; // Country code (ISO 3166-1 alpha-3)
                return intensity ? colorScale(intensity) : "#ccc"; // Grey color if no data
            })
            .on("mouseover", (event, d) => {
                const country = d.properties.name;
                const intensity = intensityData[d.id] || "No data";
                
                // Set the content and display the tooltip
                tooltip
                    .style("display", "block")
                    .html(`<strong>${country}</strong><br>CO₂ Intensity: ${intensity}`);
            })
            .on("mousemove", (event) => {
                // Position the tooltip based on mouse movement
                tooltip
                    .style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                // Hide the tooltip
                tooltip.style("display", "none");
            });

        // Add a color legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 100}, ${height - 300})`);

        const legendScale = d3.scaleLinear()
            .domain([0, 1]) // Match the domain of colorScale
            .range([200, 0]);

        const legendAxis = d3.axisRight(legendScale).ticks(5);

        legend.selectAll("rect")
            .data(d3.range(0, 1.1, 0.1)) // Adjust range and increment based on actual data values
            .enter().append("rect")
            .attr("y", d => legendScale(d))
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => colorScale(d));

        legend.append("g")
            .attr("transform", "translate(20, 0)")
            .call(legendAxis);
    });
}
window.onload = init;
