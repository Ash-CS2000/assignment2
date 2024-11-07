function init() {
    const margin = { top: 40, right: 20, bottom: 120, left: 60 },
        width = 960 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    const svg = d3.select("#chart3")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let isSorted = false;
    let currentData = [];
    let isGroupView = false;
    const years = d3.range(2010, 2020); // Years 2010 to 2019
    let activeYears = [...years]; // Initially show all years

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    function updateChart(data, labels, isGroupData = false) {
        svg.selectAll("*").remove();

        const x = d3.scaleBand().domain(labels).range([0, width]).padding(0.2);
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d3.sum(d.years.filter((_, i) => activeYears.includes(2010 + i))))])
            .nice().range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSize(0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // X-axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text(isGroupData ? "Regions" : "Country");

        svg.append("g").call(d3.axisLeft(y));

        // Y-axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .text("DALYs");

        const stack = d3.stack()
            .keys(years)
            .value((d, key) => activeYears.includes(key) ? d.years[key - 2010] || 0 : 0);

        const series = stack(data);

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute");

        svg.append("g")
            .selectAll("g")
            .data(series)
            .join("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(isGroupData ? d.data.group : d.data.country))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 1);
                const year = d3.select(this.parentNode).datum().key;
                tooltip.html(`Year: ${year}<br>Value: ${d[1] - d[0]}`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 40) + "px");
            })
            .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

        updateLegend();
    }

    function updateLegend() {
        const legend = document.getElementById("legend");
        legend.innerHTML = ''; // Clear existing legend items

        years.forEach(year => {
            const legendItem = document.createElement("div");
            legendItem.className = `legend-item ${activeYears.includes(year) ? 'active' : 'inactive'}`;
            legendItem.style.backgroundColor = activeYears.includes(year) ? color(year) : "#ccc";
            legendItem.style.color = "white";
            legendItem.textContent = `${year}`;
            
            legendItem.addEventListener("click", () => {
                if (activeYears.includes(year)) {
                    activeYears = activeYears.filter(y => y !== year); // Remove year if active
                } else {
                    activeYears.push(year); // Add year if inactive
                }
                updateChart(currentData, currentData.map(d => isGroupView ? d.group : d.country), isGroupView);
                updateLegend(); // Update legend to reflect new active state
            });

            legend.appendChild(legendItem);
        });
    }

    function isOECDCountry(country) {
        const oecdCountries = [
            "Australia", "Austria", "Belgium", "Canada", "Chile", "Colombia", "Costa Rica", "Czechia",
            "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland",
            "Israel", "Italy", "Japan", "Korea", "Latvia", "Lithuania", "Luxembourg", "Mexico", "Netherlands",
            "New Zealand", "Norway", "Poland", "Portugal", "Slovak Republic", "Slovenia", "Spain", "Sweden",
            "Switzerland", "Turkey", "United Kingdom", "United States"
        ];
        return oecdCountries.includes(country);
    }

    function aggregateGroupData(data) {
        return data.slice(-6).map(d => ({
            group: d["Reference area"],
            years: years.map(year => +d[year] || 0)
        }));
    }

    d3.csv("ThirdChart.csv").then(function(data) {
        // Log data for inspection
        // console.log("Raw Data:", data);

        const oecdData = data.filter(d => isOECDCountry(d["Reference area"]))
            .map(d => {
                const entry = {
                    country: d["Reference area"],
                    years: years.map(year => +d[year] || 0) // Explicitly access each year
                };
                console.log("Processed Entry:", entry); // Log each entry to check year data
                return entry;
            });

        const groupData = aggregateGroupData(data);

        currentData = oecdData;
        isGroupView = false;
        updateChart(currentData, currentData.map(d => d.country));

        document.getElementById("show_oecd").addEventListener("click", function() {
            currentData = oecdData;
            isGroupView = false;
            updateChart(currentData, currentData.map(d => d.country));
        });

        document.getElementById("show_groups").addEventListener("click", function() {
            currentData = groupData;
            isGroupView = true;
            updateChart(currentData, currentData.map(d => d.group), true);
        });

        document.getElementById("sort_button").addEventListener("click", function() {
            isSorted = !isSorted;
            const sortedData = isSorted
                ? [...currentData].sort((a, b) => d3.sum(b.years) - d3.sum(a.years))
                : currentData;

            const labels = isGroupView
                ? sortedData.map(d => d.group)
                : sortedData.map(d => d.country);

            updateChart(sortedData, labels, isGroupView);
        });
    }).catch(error => console.error('Error loading CSV:', error));
}

window.onload = init;
