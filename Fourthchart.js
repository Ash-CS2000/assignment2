function init() {
  let defaultyear = 2008;
  const margin = { top: 40, right: 20, bottom: 120, left: 60 },
        width = 1000,
        height = 700,
        innerRadius = 100,
        outerRadius = 400;

  const svg = d3.select("#chart4")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`);

  const tooltip = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0)
                    .style("position", "absolute")
                    .style("background", "#fff")
                    .style("border", "1px solid #ccc")
                    .style("padding", "8px")
                    .style("border-radius", "4px");

  updateChart();

  document.getElementById("year").addEventListener("click", function(){
    let year = document.getElementById("select_year").value;
    let error = document.getElementById("error");

    if(!isValidYear(year)){
        error.innerHTML = `Please enter valid year 2008-2022`;
        return;
    } else{
        error.innerHTML = "";
        updateChart(year);
    }
  });

  // Function to validate the year
  function isValidYear(year) {
    const yearNumber = parseInt(year, 10);
    return yearNumber >= 2008 && yearNumber <= 2022 && !isNaN(yearNumber);
  }

  function updateChart(year){
    d3.csv("Fourthchart.csv").then(function(data) {
      const processedData = [];
      data.forEach(d => {
        const group = d["Group"].trim();
        const activity = d["activity"].trim();
        const value = +d[year || defaultyear].replace(/,/g, "");  // Convert year values to numbers

        processedData.push({ group: group, activity: activity, value: value });
      });

      // Define colors for each group
      const colors = { 
        "Agriculture, forestry and fishing": "steelblue", 
        "Manufacturing": "orange", 
        "Water supply": "green", 
        "Transportation and storage": "red",
        "Information and communication": "purple",
      };

      // Create scales
      const angleScale = d3.scaleBand()
        .domain(processedData.map(d => d.activity))
        .range([0, 2 * Math.PI])
        .paddingInner(0.1);

      const maxValue = d3.max(processedData, d => d.value);
      const radiusScale = d3.scaleRadial()
        .domain([0, maxValue])
        .range([innerRadius, outerRadius]);

      // Clear previous paths, labels, and grid lines
      svg.selectAll("path").remove();
      svg.selectAll("text.group-label").remove();
      svg.selectAll("circle.grid-line").remove();
      svg.selectAll("text.grid-label").remove();

      // Draw radial grid lines (circles) at each 200,000 increment
      const interval = 2000000;
      for (let levelValue = interval; levelValue <= 20000000; levelValue += interval) {
        const radius = radiusScale(levelValue);

        // Draw the circle
        svg.append("circle")
            .attr("class", "grid-line")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", radius)
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-dasharray", "3,2");

        // Add label for each level
        svg.append("text")
            .attr("class", "grid-label")
            .attr("x", -50)
            .attr("y", -radius)
            .attr("dy", "-0.35em")
            .style("text-anchor", "start")
            .style("font-size", "10px")
            .style("fill", "#666")
            .text(levelValue);
      }

      // Draw bars
      svg.selectAll("path")
          .data(processedData)
          .enter()
          .append("path")
          .attr("fill", d => colors[d.group] || "gray")
          .attr("d", d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(d => radiusScale(d.value))
            .startAngle(d => angleScale(d.activity))
            .endAngle(d => angleScale(d.activity) + angleScale.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius))
          .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`Activity: ${d.activity}<br>Value: ${d.value}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 40) + "px");
          })
          .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 40) + "px");
          })
          .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

          // Add legend inside the inner radius
          const legend = svg.append("g")
          .attr("class", "inner-legend")
          .attr("transform", `translate(0, -${innerRadius / 2})`);
      
          const uniqueGroups = Array.from(new Set(processedData.map(d => d.group)));

          uniqueGroups.forEach((group, i) => {
            // Add a colored square for each group
            legend.append("rect")
              .attr("x", -80)
              .attr("y", i * 20)
              .attr("width", 10)
              .attr("height", 10)
              .attr("fill", colors[group] || "gray");
      
            // Add text label for each group
            legend.append("text")
              .attr("x", -65)
              .attr("y", i * 20 + 10)
              .style("text-anchor", "start")
              .style("font-size", "12px")
              .style("fill", colors[group] || "black")
              .text(group);
          });
    
  }).catch(error => {
      console.error("Error loading the data:", error);
    });
  }
}

window.onload = init;
