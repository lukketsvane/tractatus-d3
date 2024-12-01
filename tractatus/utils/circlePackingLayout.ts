import * as d3 from 'd3';
import { D3Node, TractatusNode } from './tractatusUtils';

const colorScheme = d3.schemeTableau10;

export function createCirclePackingLayout(
  root: D3Node,
  width: number,
  height: number,
  selectedNode: D3Node | null,
  onClick: (node: D3Node) => void,
  language: 'en' | 'de'
) {
  const pack = d3.pack<TractatusNode>()
    .size([width, height])
    .padding(3);

  const hierarchy = d3.hierarchy<TractatusNode>(root.data as TractatusNode)
    .sum(d => 1)
    .sort((a, b) => b.value! - a.value!);

  const rootNode = pack(hierarchy);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
    .attr("text-anchor", "middle");

  const colorScale = d3.scaleOrdinal(colorScheme);

  function color(d: d3.HierarchyCircularNode<TractatusNode>) {
    if (d.depth === 0) return "rgba(255, 255, 255, 0.1)"; // Root node, slightly visible
    if (d.depth === 1) return colorScale(d.data.key); // Main children
    return d.children ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.3)"; // Other nodes
  }

  const node = svg.selectAll("g")
    .data(rootNode.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  node.append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => color(d))
    .attr("stroke", d => d.depth === 1 ? color(d) : "white")
    .attr("stroke-width", d => d.depth === 1 ? 1 : 1)
    .attr("opacity", 0.7)
    .on("click", (event, d) => onClick(d as unknown as D3Node));

  const leaf = node.filter(d => !d.children);

  leaf.select("circle")
    .attr("fill", d => d.data === selectedNode?.data ? "rgba(255, 255, 255, 0.3)" : color(d))
    .attr("stroke", d => d.depth === 1 ? color(d) : "white")
    .attr("stroke-width", 1);

  leaf.append("text")
    .attr("clip-path", d => `circle(${d.r})`);

  leaf.append("title")
    .text(d => d.data.key + (d.data.content ? `: ${d.data.content[language]}` : ""));

  node.append("text")
    .attr("dy", "0.32em")
    .text(d => d.data.key)
    .attr("font-size", d => Math.min(d.r / 3, 10))
    .attr("fill", "white");

  return svg.node();
}

